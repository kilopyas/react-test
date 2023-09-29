import { json, redirect } from "@remix-run/node";
import { useLoaderData, useSubmit } from "@remix-run/react";
import {
  Card,
  Grid,
  HorizontalStack,
  Layout,
  LegacyCard,
  Page,
  Thumbnail,
} from "@shopify/polaris";
import { getTicket } from "~/models/Ticket.server";
import { authenticate } from "~/shopify.server";
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

  return (
    <Page 
      title={ticket.title}
      backAction={{content: ticket.title, url: '/app/list'}}
      fullWidth
      divider>
      <ui-title-bar/>
      <Layout>
        <Layout.Section>
          <Grid>
            <Grid.Cell columnSpan={{xs: 6, sm: 3, md: 3, lg: 8, xl: 8}}>
              <LegacyCard title="Content" sectioned>
                <p>{ ticket.content }</p>
              </LegacyCard>
            </Grid.Cell>
            <Grid.Cell columnSpan={{xs: 6, sm: 3, md: 3, lg: 4, xl: 4}}>
              <LegacyCard title="Attachments" sectioned>
                { ticket.image_url ? 
                  <Layout.Section>
                    <Card>
                      <HorizontalStack gap="3">
                        {
                          imageUrls.map(imageUrl => (
                            <Thumbnail
                              size="large"
                              source={imageUrl}
                              alt={imageUrl}
                            />
                          ))
                        }
                      </HorizontalStack>
                    </Card>
                  </Layout.Section>
                    : <p>No attachments</p>
                }
              </LegacyCard>
            </Grid.Cell>
          </Grid>
        </Layout.Section>
      </Layout>
    </Page>
  );
}