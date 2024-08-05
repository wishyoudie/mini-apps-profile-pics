import { useInitData } from "@telegram-apps/sdk-react";
import { Avatar, Subheadline } from "@telegram-apps/telegram-ui";

export default function Guide() {
  const initData = useInitData();

  return (
    <article>
      <Avatar src="TODO" />
      <Subheadline>{initData?.user?.firstName}</Subheadline>
    </article>
  );
}
