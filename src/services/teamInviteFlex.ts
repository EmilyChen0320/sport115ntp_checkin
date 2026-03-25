/** LINE Flex Bubble（shareTargetPicker 用），型別寬鬆以避免過度耦合 Messaging API 版本差異 */
export type FlexBubbleMessage = {
  type: "flex";
  altText: string;
  contents: Record<string, unknown>;
};

export function buildTeamJoinFlexBubble(params: {
  heroImageUrl: string;
  teamName: string;
  memberLabel: string;
  joinUri: string;
}): FlexBubbleMessage {
  return {
    type: "flex",
    altText: `${params.teamName} 邀請你加入隊伍`,
    contents: {
      type: "bubble",
      hero: {
        type: "image",
        url: params.heroImageUrl,
        size: "full",
        aspectRatio: "20:13",
        aspectMode: "cover",
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: params.teamName,
            weight: "bold",
            size: "xl",
            wrap: true,
          },
          {
            type: "text",
            text: params.memberLabel,
            size: "sm",
            color: "#666666",
            wrap: true,
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "button",
            style: "primary",
            height: "sm",
            action: {
              type: "uri",
              label: "點擊加入隊伍",
              uri: params.joinUri,
            },
          },
        ],
      },
    },
  };
}
