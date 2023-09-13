import { json, redirect } from "@remix-run/node";
import { useLoaderData, useSubmit } from "@remix-run/react";
import {
  Card,
  HorizontalStack,
  Icon,
  Layout,
  Page,
  Text,
  Thumbnail,
  VerticalStack,
} from "@shopify/polaris";
import { getTicket } from "~/models/Ticket.server";
import { authenticate } from "~/shopify.server";
import {
  MobileBackArrowMajor
} from '@shopify/polaris-icons';
import { useState } from "react";

export async function loader({ request, params }) {
  console.log('paramsparamsparamsparamsparamsparams', params);
  console.log('requestrequestrequestrequestrequestrequest', request);
  const { session } = await authenticate.admin(request);
  const ticket = await getTicket(params.id);

  return json({
    ticket,
  });
}

export async function action({ request }) {
  /** @type {any} */
  const data = {
    ...Object.fromEntries(await request.formData())
  };
  const action = data.action;
  delete data.action;

  switch(action) {
    case "back":
      return redirect("/app/list");
  } 

}

export default function ViewPage() {
  const submit = useSubmit();
  const { ticket } = useLoaderData();
  const [imageUrls, setImageUrls] = useState(JSON.parse(ticket.image_url));
  
  console.log('test', imageUrls);

  const handleBack = () => {
    submit({action: 'back'}, { method: "post" });
  }

  return (
    <Page>
      <ui-title-bar title={ticket.title} />
      <Layout>

        <Layout.Section>
          <div onClick={handleBack} style={{ marginBottom: '10px', cursor: 'pointer' }}>
              <Icon
                source={MobileBackArrowMajor}
                color="base"
              />
          </div>
        </Layout.Section>
        { ticket.image_url ? 
          <Layout.Section>
            <Card>
              <HorizontalStack gap="3">
                {
                  imageUrls.map(imageUrl => (
                    <Thumbnail
                      size="large"
                      source={imageUrl}
                      alt="Black choker necklace"
                    />
                  ))
                }
              </HorizontalStack>
            </Card>
          </Layout.Section>
            : null
          }
        <Layout.Section>
          <Card>
            <VerticalStack gap="3">
              <Text as="p" variant="bodyMd">
                {ticket.content}
              </Text>
            </VerticalStack>
          </Card>
        </Layout.Section>

      </Layout>
    </Page>
  );
}