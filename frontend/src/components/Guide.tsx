import { useInitData } from "@telegram-apps/sdk-react";
import { Avatar, Subheadline } from "@telegram-apps/telegram-ui";
import { useEffect, useState } from "react";

export default function Guide() {
  const initData = useInitData();
  const initialValue = initData?.user?.photoUrl; // Naive, isn't it?
  const [src, setSrc] = useState<string | undefined>(initialValue);

  useEffect(() => {
    const user = initData?.user;
    const fetchProflePicture = async () => {
      const response = await fetch(`http://localhost:3000/${user?.id}`);
      const data = await response.json();
      setSrc(data.result);
    };

    fetchProflePicture();
  }, [initData]);

  return (
    <article>
      <Avatar src={src} />
      <Subheadline>{initData?.user?.firstName}</Subheadline>
    </article>
  );
}
