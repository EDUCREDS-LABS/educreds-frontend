import React from 'react';

const VerificationSection = () => {
  return (
    <div className="w-full">
      
      {/* Image Section */}
      <div className="w-full">
        <img 
          src="/images/bg.png" 
          alt="EduCreds Verification" 
          className="w-full h-auto object-cover"
        />
      </div>
      
      {/* Content Section */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white py-20 px-6">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Transforming Lives Through
            <br />
             Digital Verification
          </h2>
        </div>

        {/* Three-step process */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 lg:gap-24 mb-20 text-left">
          {/* Step 1: Instant Verification */}
          <div className="relative text-left p-6 lg:p-8">
            {/* Arrow connector - hidden on mobile, visible on lg+ */}
            <div className="hidden lg:block absolute top-1/3 -right-12 transform -translate-y-1/2 z-10">
              <div ></div>
            </div>
            
                         <div className="flex flex-col items-center text-center">
               {/* Your Icon */}
               <div className="w-150 h-150 lg:w-150 lg:h-64 mb-3">
                 <img 
                   src="/images/icon1.png" 
                   alt="Instant Verification" 
                   className="w-full h-full object-contain"
                 />
               </div>
               
               <h3 className="text-3xl lg:text-4xl font-bold mb-6 text-white leading-tight">
                 Instant
                 <br />
                 Verification
               </h3>
               
               <p className="text-gray-300 leading-relaxed text-lg lg:text-xl max-w-sm">
                 In a world, where fake transcripts and forged certificates are a growing problem, our project introduces a fast, trustless verification system.
               </p>
             </div>
          </div>

          {/* Step 2: Building Trust */}
          <div className="relative text-center p-6 lg:p-8">
            {/* Arrow connector */}
            <div className="hidden lg:block absolute top-1/3 -right-12 transform -translate-y-1/2 z-10">
              <div ></div>
            </div>
            
                         <div className="flex flex-col items-center">
               {/* Your Icon */}
               <div className="w-150 h-150 lg:w-150 lg:h-64 mb-3">
                 <img 
                   src="/images/icon2.png" 
                   alt="Building Trust" 
                   className="w-full h-full object-contain"
                 />
               </div>
               
               <h3 className="text-3xl lg:text-4xl font-bold mb-6 text-white leading-tight">Building Trust</h3>
               
               <p className="text-gray-300 leading-relaxed text-lg lg:text-xl max-w-sm">
                 Employers, universities, and agencies can instantly confirm a certificate's authenticity by checking the NFT on the Base blockchain â€” no need to call or write to institutions.
               </p>
             </div>
          </div>

          {/* Step 3: National Impact */}
          <div className="relative text-center p-6 lg:p-8">
                         <div className="flex flex-col items-center">
               {/* Your Icon */}
               <div className="w-150 h-150 lg:w-150 lg:h-64 mb-3">
                 <img 
                   src="/images/icon3.png" 
                   alt="National Impact" 
                   className="w-full h-full object-contain"
                 />
               </div>
               
               <h3 className="text-3xl lg:text-4xl font-bold mb-6 text-white leading-tight">National Impact</h3>
               
               <p className="text-gray-300 leading-relaxed text-lg lg:text-xl max-w-sm">
                 This builds trust, reduces fraud, and supports national goals like digital transformation and transparent service delivery.
               </p>
             </div>
          </div>
        </div>

        {/* Bottom description */}
        <div className="text-center">
          <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
             EduCreds technology ensures certificates cannot be forged, altered, or duplicated, providing ultimate security.
          </p>
        </div>
              </div>
      </section>
    </div>
  );
};

export default VerificationSection;