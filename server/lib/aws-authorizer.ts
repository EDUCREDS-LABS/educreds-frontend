import { APIGatewayAuthorizerResult, APIGatewayTokenAuthorizerEvent } from 'aws-lambda';
import { createHash } from 'crypto';
import { neon } from '@neondatabase/serverless';

/**
 * AWS Lambda Authorizer for API Key validation
 * 
 * This authorizer validates API keys against the PostgreSQL database
 * and returns an IAM policy allowing or denying access to API Gateway.
 * 
 * Environment Variables Required:
 * - DATABASE_URL: PostgreSQL connection string
 */

const sql = neon(process.env.DATABASE_URL!);

/**
 * Hash an API key using SHA-256
 */
function hashApiKey(apiKey: string): string {
    return createHash('sha256').update(apiKey).digest('hex');
}

/**
 * Generate IAM policy for API Gateway
 */
function generatePolicy(
    principalId: string,
    effect: 'Allow' | 'Deny',
    resource: string,
    context?: Record<string, string | number | boolean>
): APIGatewayAuthorizerResult {
    return {
        principalId,
        policyDocument: {
            Version: '2012-10-17',
            Statement: [
                {
                    Action: 'execute-api:Invoke',
                    Effect: effect,
                    Resource: resource,
                },
            ],
        },
        context,
    };
}

/**
 * Lambda handler for API Key authorization
 */
export async function handler(
    event: APIGatewayTokenAuthorizerEvent
): Promise<APIGatewayAuthorizerResult> {
    const apiKey = event.authorizationToken?.replace('Bearer ', '');

    if (!apiKey) {
        throw new Error('Unauthorized'); // Returns 401
    }

    try {
        // Hash the provided API key
        const keyHash = hashApiKey(apiKey);

        // Query the database for the API key
        const result = await sql`
      SELECT 
        ak.id,
        ak."institutionId",
        ak."isActive",
        ak."expiresAt",
        i.name as "institutionName"
      FROM api_keys ak
      JOIN institutions i ON ak."institutionId" = i.id
      WHERE ak."keyHash" = ${keyHash}
      LIMIT 1
    `;

        if (result.length === 0) {
            // API key not found
            return generatePolicy('user', 'Deny', event.methodArn);
        }

        const apiKeyRecord = result[0];

        // Check if key is active
        if (!apiKeyRecord.isActive) {
            return generatePolicy('user', 'Deny', event.methodArn);
        }

        // Check if key is expired
        if (apiKeyRecord.expiresAt && new Date(apiKeyRecord.expiresAt) < new Date()) {
            return generatePolicy('user', 'Deny', event.methodArn);
        }

        // Update last used timestamp (fire-and-forget)
        sql`
      UPDATE api_keys 
      SET "lastUsedAt" = NOW() 
      WHERE id = ${apiKeyRecord.id}
    `.then(() => { }).catch(console.error);

        // API key is valid - allow access
        return generatePolicy(
            apiKeyRecord.institutionId as string,
            'Allow',
            event.methodArn,
            {
                institutionId: apiKeyRecord.institutionId as string,
                institutionName: apiKeyRecord.institutionName as string,
                apiKeyId: apiKeyRecord.id as string,
            }
        );
    } catch (error) {
        console.error('Error validating API key:', error);
        throw new Error('Unauthorized');
    }
}
