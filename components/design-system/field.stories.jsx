import React from "react";
import { FieldLabel, Input, Select, Textarea } from "./field";
import { Card } from "./card";

export default {
  title: "Design System/Field",
};

export function DefaultFields() {
  return React.createElement(
    Card,
    { className: "w-[520px]" },
    React.createElement(
      "div",
      { className: "grid gap-5" },
      React.createElement(
        "div",
        null,
        React.createElement(FieldLabel, { htmlFor: "field-name" }, "Nome"),
        React.createElement(Input, { id: "field-name", placeholder: "Seu nome completo" }),
      ),
      React.createElement(
        "div",
        null,
        React.createElement(FieldLabel, { htmlFor: "field-category" }, "Categoria"),
        React.createElement(
          Select,
          { id: "field-category", defaultValue: "" },
          React.createElement("option", { value: "" }, "Selecione"),
          React.createElement("option", { value: "health" }, "Saúde"),
        ),
      ),
      React.createElement(
        "div",
        null,
        React.createElement(FieldLabel, { htmlFor: "field-description" }, "Descrição"),
        React.createElement(Textarea, { id: "field-description", rows: 4, placeholder: "Conte sobre seus serviços..." }),
      ),
    ),
  );
}
