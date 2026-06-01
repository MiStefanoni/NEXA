import React from "react";
import { Button } from "./button";

export default {
  title: "Design System/Button",
  component: Button,
};

export function Variants() {
  return React.createElement(
    "div",
    { className: "flex flex-wrap gap-3" },
    React.createElement(Button, null, "Primary"),
    React.createElement(Button, { variant: "secondary" }, "Secondary"),
    React.createElement(Button, { variant: "ghost" }, "Ghost"),
    React.createElement(Button, { variant: "destructive" }, "Destructive"),
    React.createElement(Button, { variant: "chip", size: "sm", className: "rounded-full" }, "Chip"),
    React.createElement(Button, { variant: "chipActive", size: "sm", className: "rounded-full" }, "Chip Active"),
  );
}
