import ClientHome from "~/components/clientHome";
import { apiS, HydrateClient } from "~/trpc/server";
import { loadOnOffConfig } from "~/server/onoff";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { loginRequired } = await apiS.user.checkLoginState();
  const schedule = loadOnOffConfig();

  return (
    <HydrateClient>
      <ClientHome
        initialLoginState={!loginRequired}
        schedule={schedule}
      />
    </HydrateClient>
  );
}
