import {useEffect, useState} from 'react';
import {
  reactExtension,
  useApi,
  AdminAction,
  BlockStack,
  Button,
  Text,
} from '@shopify/ui-extensions-react/admin';
import { Html5Qrcode } from 'html5-qrcode';

// The target used here must match the target used in the extension's toml file (./shopify.extension.toml)
const TARGET = 'admin.product-details.action.render';

export default reactExtension(TARGET, () => <App />);

function App() {
  // The useApi hook provides access to several useful APIs like i18n, close, and data.
  const {extension: {target}, i18n, close, data} = useApi(TARGET);

  const [productTitle, setProductTitle] = useState('');

  const [detectedQRCode, setDetectedQRCode] = useState(null);

  // Function to handle QR code detection
  const handleQRCodeDetected = (qrcode) => {
    // Perform actions with the detected QR code
    setDetectedQRCode(qrcode);
  };

  // Use direct API calls to fetch data from Shopify.
  // See https://shopify.dev/docs/api/admin-graphql for more information about Shopify's GraphQL API
  useEffect(() => {
    (async function getProductInfo() {
      const getProductQuery = {
        query: `query Product($id: ID!) {
          product(id: $id) {
            title
          }
        }`,
        variables: {id: data.selected[0].id},
      };

      const res = await fetch("shopify:admin/api/graphql.json", {
        method: "POST",
        body: JSON.stringify(getProductQuery),
      });

      if (!res.ok) {
        console.error('Network error');
      }

      const productData = await res.json();
      setProductTitle(productData.data.product.title);
    })();
  }, []);

  return (
    // The AdminAction component provides an API for setting the title and actions of the Action extension wrapper.
      <AdminAction
        primaryAction={
          <Button
            onPress={() => {
              console.log('saving');
              close();
            }}
          >
            Done
          </Button>
        }
        secondaryAction={
          <Button
            onPress={() => {
              console.log('closing');
              close();
            }}
          >
            Close
          </Button>
        }
      >
        <BlockStack>
          {/* Set the translation values for each supported language in the locales directory */}
          <Text fontWeight="bold">{i18n.translate('welcome', {target})}</Text>
          <Text>Current product: {productTitle}</Text>
          <QRCodeScanner handleQRCodeDetected={handleQRCodeDetected} />
        </BlockStack>
      </AdminAction>
  );
}

function QRCodeScanner({ handleQRCodeDetected }) {

  const reader = (
      <div id="reader"></div>
  );

  useEffect(() => {
    // Create instance of the object. The only argument is the "id" of HTML element created above.
    const html5QrCode = new Html5Qrcode("reader");
    // const cameraId = await enumerateAvailableCameras();

    html5QrCode.start(
      { facingMode: "environment" },
      // cameraId,     // retreived in the previous step.
      {
        fps: 10,    // sets the framerate to 10 frame per second
        qrbox: 250  // sets only 250 X 250 region of viewfinder to
                    // scannable, rest shaded.
      },
      qrCodeMessage => {
        // do something when code is read. For example:
        console.log(`QR Code detected: ${qrCodeMessage}`);
      },
      errorMessage => {
        // parse error, ideally ignore it. For example:
        console.log(`QR Code no longer in front of camera.`);
      })
    .catch(err => {
      // Start failed, handle it. For example,
      console.log(`Unable to start scanning, error: ${err}`);
    });

    return () => {
      // Cleanup
      html5QrCode.stop();
    };
  }, [handleQRCodeDetected]);

  // return (
  //   <div>
  //     <div id="reader"></div>
  //   </div>
  // );
  // return <div id="reader"></div>;
  return (
    <BlockStack>
      {reader}
    </BlockStack>
  );
}


// function enumerateAvailableCameras() {
//   var cameraId = "";
//   // This method will trigger user permissions
//   await Html5Qrcode.getCameras().then(devices => {
//     /**
//      * devices would be an array of objects of type:
//      * { id: "id", label: "label" }
//      */
//     if (devices && devices.length) {
//       cameraId = devices[0].id;
//       // .. use this to start scanning.
//     }
//   }).catch(err => {
//     // handle err
//   });

//   return cameraId;
// }
