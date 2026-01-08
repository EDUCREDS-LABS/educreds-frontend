import { Editor } from 'grapesjs';

export const createGrapesJSConfig = (): any => ({
  height: '100vh',
  width: 'auto',
  storageManager: false,
  blockManager: {
    blocks: [
      {
        id: 'text',
        label: 'Text',
        content: '<div data-gjs-type="text">Insert your text here</div>',
        category: 'Basic',
        attributes: { class: 'fa fa-font' }
      },
      {
        id: 'heading',
        label: 'Heading',
        content: '<h1 data-gjs-type="text">Heading</h1>',
        category: 'Basic',
        attributes: { class: 'fa fa-header' }
      },
      {
        id: 'image',
        label: 'Image',
        content: { type: 'image' },
        category: 'Basic',
        attributes: { class: 'fa fa-image' }
      },
      {
        id: 'button',
        label: 'Button',
        content: '<button data-gjs-type="text">Button</button>',
        category: 'Basic',
        attributes: { class: 'fa fa-square-o' }
      },
      {
        id: 'div',
        label: 'Container',
        content: '<div data-gjs-type="default">Container</div>',
        category: 'Layout',
        attributes: { class: 'fa fa-square' }
      },
      {
        id: 'certificate-frame',
        label: 'Certificate Frame',
        content: `
          <div class="certificate-frame" style="
            border: 3px solid #667eea;
            border-radius: 20px;
            padding: 40px;
            background: white;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            text-align: center;
            min-height: 400px;
            display: flex;
            flex-direction: column;
            justify-content: center;
          ">
            <div class="certificate-content">
              <h1 class="certificate-title" style="
                font-size: 2.5em;
                color: #333;
                margin-bottom: 20px;
                font-weight: bold;
              ">Certificate of Completion</h1>
              <p class="certificate-subtitle" style="
                font-size: 1.2em;
                color: #666;
                margin-bottom: 30px;
                font-style: italic;
              ">This certifies that</p>
              <div class="student-name" style="
                font-size: 2em;
                color: #667eea;
                font-weight: bold;
                margin: 20px 0;
              ">{{studentName}}</div>
              <p class="course-description" style="
                font-size: 1.1em;
                color: #333;
                margin: 20px 0;
              ">has successfully completed</p>
              <div class="course-name" style="
                font-size: 1.5em;
                color: #333;
                font-weight: bold;
                margin: 20px 0;
              ">{{courseTitle}}</div>
              <p class="date" style="
                font-size: 1em;
                color: #666;
                margin-top: 30px;
              ">on {{issueDate}}</p>
            </div>
          </div>
        `,
        category: 'Certificate',
        attributes: { class: 'fa fa-certificate' }
      },
      {
        id: 'signature-line',
        label: 'Signature Line',
        content: `
          <div class="signature-section" style="
            margin-top: 50px;
            display: flex;
            justify-content: space-between;
            align-items: end;
          ">
            <div class="signature-item">
              <div class="signature-line" style="
                border-bottom: 2px solid #333;
                width: 200px;
                margin-bottom: 10px;
              "></div>
              <p style="font-size: 0.9em; color: #666;">Signature</p>
            </div>
            <div class="signature-item">
              <div class="signature-line" style="
                border-bottom: 2px solid #333;
                width: 200px;
                margin-bottom: 10px;
              "></div>
              <p style="font-size: 0.9em; color: #666;">Date</p>
            </div>
          </div>
        `,
        category: 'Certificate',
        attributes: { class: 'fa fa-pencil' }
      },
      {
        id: 'logo-placeholder',
        label: 'Logo Placeholder',
        content: `
          <div class="logo-placeholder" style="
            width: 100px;
            height: 100px;
            border: 2px dashed #ccc;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f9f9f9;
            border-radius: 8px;
            margin: 0 auto;
          ">
            <span style="color: #999; font-size: 0.8em;">Logo</span>
          </div>
        `,
        category: 'Certificate',
        attributes: { class: 'fa fa-image' }
      }
    ]
  },
  layerManager: {},
  deviceManager: {
    devices: [
      {
        name: 'Desktop',
        width: '',
      },
      {
        name: 'Tablet',
        width: '768px',
        widthMedia: '992px',
      },
      {
        name: 'Mobile',
        width: '320px',
        widthMedia: '768px',
      }
    ]
  },
  plugins: [
    'gjs-blocks-basic',
    'gjs-plugin-forms',
    'gjs-component-countdown',
    'gjs-plugin-export',
    'gjs-tabs',
    'gjs-custom-code',
    'gjs-touch',
    'gjs-parser-postcss',
    'gjs-style-bg',
    'gjs-style-filter',
    'gjs-style-border',
    'gjs-style-gradient',
    'gjs-style-svg',
    'gjs-typed'
  ],
  pluginsOpts: {
    'gjs-blocks-basic': { flexGrid: 1 },
    'gjs-plugin-forms': {
      blocks: ['form', 'input', 'textarea', 'select', 'button', 'label', 'checkbox', 'radio']
    },
    'gjs-component-countdown': {
      blocks: ['countdown']
    },
    'gjs-plugin-export': {},
    'gjs-tabs': {
      tabsBlock: { category: 'Extra' }
    },
    'gjs-custom-code': {},
    'gjs-touch': {},
    'gjs-parser-postcss': {},
    'gjs-style-bg': {},
    'gjs-style-filter': {},
    'gjs-style-border': {},
    'gjs-style-gradient': {},
    'gjs-style-svg': {},
    'gjs-typed': {
      block: 'typed'
    }
  },
  canvas: {
    styles: [
      'https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css'
    ],
    scripts: [
      'https://code.jquery.com/jquery-3.3.1.slim.min.js',
      'https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/js/bootstrap.min.js'
    ]
  },
  traitManager: {},
  selectorManager: {},
  styleManager: {
    sectors: [
      {
        name: 'Dimension',
        open: false,
        buildProps: ['width', 'min-height', 'padding'],
        properties: [
          {
            type: 'integer',
            name: 'The width',
            property: 'width',
            units: ['px', '%'],
            defaults: 'auto',
            min: 0,
          }
        ]
      },
      {
        name: 'Extra',
        open: false,
        buildProps: ['background-color', 'box-shadow', 'custom-prop'],
        properties: [
          {
            id: 'custom-prop',
            name: 'Custom Label',
            property: 'font-size',
            type: 'select',
            defaults: '32px',
            options: [
              { value: '12px', name: 'Tiny' },
              { value: '18px', name: 'Medium' },
              { value: '32px', name: 'Big' },
            ],
          }
        ]
      }
    ]
  }
});

export const A4_CANVAS_SIZE = {
  width: 794, // A4 width in pixels at 96 DPI
  height: 1123 // A4 height in pixels at 96 DPI
};

export const CERTIFICATE_CANVAS_SIZE = {
  width: 800,
  height: 600
};
