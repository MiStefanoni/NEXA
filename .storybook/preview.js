import "../app/globals.css";

const preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "ivory",
      values: [
        { name: "ivory", value: "#F7F6F4" },
        { name: "white", value: "#FFFFFF" },
        { name: "nexa_nude", value: "#F9E1CF" },
      ],
    },
    layout: "centered",
  },
};

export default preview;
