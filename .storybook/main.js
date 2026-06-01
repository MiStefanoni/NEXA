/** @type { import('@storybook/react-vite').StorybookConfig } */
const config = {
  stories: [
    "../stories/**/*.mdx",
    "../stories/**/*.stories.@(js|jsx)",
    "../components/**/*.stories.@(js|jsx)",
  ],
  addons: [
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  staticDirs: ["../public"],
  async viteFinal(existingConfig) {
    const { mergeConfig } = await import("vite");

    return mergeConfig(existingConfig, {
      esbuild: {
        loader: "jsx",
        include: /\/(app|components|lib)\/.*\.js$/,
      },
      optimizeDeps: {
        esbuildOptions: {
          loader: {
            ".js": "jsx",
          },
        },
      },
    });
  },
};

export default config;
