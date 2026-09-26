window.__ModuleLoader__.load({ id: "dsh-opencode-go-plus", factory: (require) => { var module = { exports: {} }; var exports = module.exports;
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.ts
var index_exports = {};
__export(index_exports, {
  OPENCODE_GO_NS: () => OPENCODE_GO_NS,
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);

// src/client/Section.tsx
var import_react = require("react");
var import_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");

// plugin-css:D:\data\data_traework\deepseek\dsh-opencode-go-live\src\client\Section.module.css
var id = "dsh-opencode-go/Section.module.css";
if (!document.querySelector("style[data-plugin-css=" + JSON.stringify(id) + "]")) {
  const style = document.createElement("style");
  style.dataset.plugin = "dsh-opencode-go";
  style.dataset.pluginCss = id;
  style.textContent = ".eMreYG_field{flex-direction:column;gap:6px;padding:12px 0;display:flex}.eMreYG_field+.eMreYG_field{border-top:.5px solid var(--dsw-alias-border-l2)}.eMreYG_head{align-items:center;gap:8px;display:flex}.eMreYG_label{min-width:0;color:var(--dsw-alias-label-primary);flex:1;font-size:13px;font-weight:500;line-height:1.5}.eMreYG_badges{align-items:center;gap:8px;display:inline-flex}.eMreYG_reset{font:inherit;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:none;padding:0;font-size:12px;line-height:1.5}.eMreYG_reset:hover:not(:disabled){color:var(--dsw-alias-label-primary)}.eMreYG_reset:disabled{cursor:default}.eMreYG_input{border:.5px solid var(--dsw-alias-border-l4);background:var(--dsw-alias-bg-layer-3);height:34px;font:inherit;color:var(--dsw-alias-label-primary);border-radius:8px;padding:0 12px;font-size:13px;line-height:1.5}.eMreYG_input:focus-visible{border-color:var(--dsw-alias-brand-primary);outline:none}.eMreYG_input:disabled{color:var(--dsw-alias-label-tertiary);cursor:default}.eMreYG_inputInvalid{border-color:var(--dsw-alias-label-error);}.eMreYG_invalid{color:var(--dsw-alias-label-error);margin:0;font-size:12px;line-height:1.5}.eMreYG_hint{color:var(--dsw-alias-label-tertiary);margin:0;font-size:12px;line-height:1.5}.eMreYG_intro{color:var(--dsw-alias-label-secondary);margin:0 0 8px;font-size:13px;line-height:1.5}.eMreYG_disclosure{font:inherit;text-align:left;cursor:pointer;background:0 0;border:none;align-items:center;gap:8px;margin:0;padding:0;display:flex}.eMreYG_disclosure:hover .eMreYG_label{color:var(--dsw-alias-brand-primary)}.eMreYG_chevron,.eMreYG_chevronOpen{color:var(--dsw-alias-label-tertiary);flex:none}.eMreYG_chevron{transform:rotate(-90deg)}.eMreYG_advanced{flex-direction:column;gap:4px;padding:4px 0 0 22px;display:flex}.eMreYG_advanced .eMreYG_field+.eMreYG_field{border-top:none}.eMreYG_chips{flex-wrap:wrap;gap:6px;display:flex}.eMreYG_actions{align-items:center;gap:8px;padding-top:12px;display:flex}.eMreYG_failedNote{color:var(--dsw-alias-label-error);margin:0;font-size:12px;line-height:1.5}";
  document.head.appendChild(style);
}
var Section_default = { "intro": "eMreYG_intro", "input": "eMreYG_input", "advanced": "eMreYG_advanced", "field": "eMreYG_field", "actions": "eMreYG_actions", "failedNote": "eMreYG_failedNote", "reset": "eMreYG_reset", "disclosure": "eMreYG_disclosure", "head": "eMreYG_head", "hint": "eMreYG_hint", "badges": "eMreYG_badges", "label": "eMreYG_label", "chips": "eMreYG_chips", "inputInvalid": "eMreYG_inputInvalid", "chevronOpen": "eMreYG_chevronOpen", "invalid": "eMreYG_invalid", "chevron": "eMreYG_chevron" };

// src/client/Section.tsx
var import_jsx_runtime = require("react/jsx-runtime");
function ValueField(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: Section_default.field, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: Section_default.head, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { className: Section_default.label, htmlFor: props.id, children: props.label }),
      props.field.overridden ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: Section_default.badges, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Tag, { tone: "neutral", children: props.overriddenLabel }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "button",
          {
            type: "button",
            className: Section_default.reset,
            disabled: props.disabled,
            onClick: props.onReset,
            children: props.resetLabel
          }
        )
      ] }) : null
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "input",
      {
        id: props.id,
        className: props.field.invalid ? Section_default.inputInvalid : Section_default.input,
        type: "text",
        ...props.numeric === true ? { inputMode: "numeric" } : {},
        ...props.field.invalid ? { "aria-invalid": true } : {},
        value: props.field.text,
        disabled: props.disabled,
        onChange: (event) => {
          props.onEdit(event.target.value);
        }
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: props.field.invalid ? Section_default.invalid : Section_default.hint, children: props.field.invalid ? props.invalidLabel : props.hint })
  ] });
}
function ModelsBody({ models, t }) {
  if (models.status === "failed") {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: Section_default.failedNote, children: t("modelsFailed") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: Section_default.hint, children: models.message })
    ] });
  }
  if (models.status !== "ready") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: Section_default.hint, children: t("modelsLoading") });
  if (models.count === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: Section_default.hint, children: t("modelsEmpty") });
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: Section_default.chips, children: models.preview.map((name) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Tag, { tone: "outline", children: name }, name)) });
}
function OpencodeGoSection(props) {
  const { useOpencodeGo, edit, resetField, save, discard, loadModels, setEnabled, setAutoDiscover, t } = props;
  if (useOpencodeGo === void 0 || edit === void 0 || resetField === void 0 || save === void 0 || discard === void 0 || loadModels === void 0 || setEnabled === void 0 || setAutoDiscover === void 0 || t === void 0) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    Loaded,
    {
      state: useOpencodeGo((snapshot) => snapshot),
      t,
      edit,
      resetField,
      save,
      discard,
      loadModels,
      setEnabled,
      setAutoDiscover
    }
  );
}
function Loaded(props) {
  const { t, state, loadModels } = props;
  const [advanced, setAdvanced] = (0, import_react.useState)(false);
  (0, import_react.useEffect)(() => {
    if (state.available && state.models.status === "idle") loadModels();
  }, [state.available, state.models.status, loadModels]);
  if (!state.available) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: Section_default.intro, children: t("unavailable") });
  }
  const disabled = !state.writable;
  const fieldProps = {
    invalidLabel: t("invalidValue"),
    overriddenLabel: t("overridden"),
    resetLabel: t("reset"),
    disabled
  };
  const advancedOverridden = state.apiKeyEnv.overridden || state.baseURL.overridden || state.refreshMinutes.overridden || state.streamIdleTimeoutMs.overridden || state.maxRequestImageBytes.overridden || state.requestImagePixelBudget.overridden || state.requestImageMaxBytes.overridden;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: Section_default.intro, children: t("intro") }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: Section_default.field, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: Section_default.head, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: Section_default.label, children: t("enabledLabel") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          import_dsh_client_ui_primitives.Switch,
          {
            checked: state.enabled,
            label: t("enabledLabel"),
            disabled,
            onChange: props.setEnabled
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: Section_default.hint, children: state.enabled ? t("enabledHint") : t("enabledOff") })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: Section_default.field, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: Section_default.head, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { className: Section_default.label, htmlFor: "opencode-go-key", children: t("keyLabel") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: Section_default.badges, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Tag, { tone: state.apiKeyConfigured ? "success" : "warning", children: state.apiKeyConfigured ? t("keyConfigured") : t("keyMissing") }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "input",
        {
          id: "opencode-go-key",
          className: Section_default.input,
          type: "password",
          autoComplete: "off",
          value: state.apiKey.text,
          disabled: !state.apiKeyWritable,
          onChange: (event) => {
            props.edit("apiKey", event.target.value);
          }
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: Section_default.hint, children: state.apiKeyWritable ? t("keyHint") : t("keyNotWritable") })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: Section_default.field, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: Section_default.head, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: Section_default.label, children: t("modelsLabel") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: Section_default.badges, children: [
          state.models.status === "ready" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Tag, { tone: "neutral", children: t("modelsCount", { count: state.models.count }) }) : null,
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "button",
            {
              type: "button",
              className: Section_default.reset,
              disabled: state.models.status === "loading",
              onClick: loadModels,
              children: t("modelsRefresh")
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModelsBody, { models: state.models, t })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: Section_default.field, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: Section_default.head, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: Section_default.label, children: t("autoDiscoverLabel") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          import_dsh_client_ui_primitives.Switch,
          {
            checked: state.autoDiscover,
            label: t("autoDiscoverLabel"),
            disabled,
            onChange: props.setAutoDiscover
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: Section_default.hint, children: state.autoDiscover ? t("autoDiscoverHint") : t("autoDiscoverOff") })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: Section_default.field, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
        "button",
        {
          type: "button",
          className: Section_default.disclosure,
          "aria-expanded": advanced,
          "aria-controls": "opencode-go-advanced",
          onClick: () => {
            setAdvanced(!advanced);
          },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.IconChevronDownOutline14, { className: advanced ? Section_default.chevronOpen : Section_default.chevron }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: Section_default.label, children: t("advancedLabel") }),
            advancedOverridden ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Tag, { tone: "neutral", children: t("overridden") }) : null
          ]
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: Section_default.hint, children: t("advancedHint") }),
      advanced ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { id: "opencode-go-advanced", className: Section_default.advanced, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          ValueField,
          {
            id: "opencode-go-api-key-env",
            label: t("apiKeyEnvLabel"),
            hint: t("apiKeyEnvHint"),
            field: state.apiKeyEnv,
            ...fieldProps,
            onEdit: (text) => {
              props.edit("apiKeyEnv", text);
            },
            onReset: () => {
              props.resetField("apiKeyEnv");
            }
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          ValueField,
          {
            id: "opencode-go-base-url",
            label: t("baseURLLabel"),
            hint: t("baseURLHint"),
            field: state.baseURL,
            ...fieldProps,
            onEdit: (text) => {
              props.edit("baseURL", text);
            },
            onReset: () => {
              props.resetField("baseURL");
            }
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          ValueField,
          {
            id: "opencode-go-refresh-minutes",
            label: t("refreshMinutesLabel"),
            hint: t("refreshMinutesHint"),
            field: state.refreshMinutes,
            numeric: true,
            ...fieldProps,
            onEdit: (text) => {
              props.edit("refreshMinutes", text);
            },
            onReset: () => {
              props.resetField("refreshMinutes");
            }
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          ValueField,
          {
            id: "opencode-go-stream-idle",
            label: t("streamIdleTimeoutMsLabel"),
            hint: t("streamIdleTimeoutMsHint"),
            field: state.streamIdleTimeoutMs,
            numeric: true,
            ...fieldProps,
            onEdit: (text) => {
              props.edit("streamIdleTimeoutMs", text);
            },
            onReset: () => {
              props.resetField("streamIdleTimeoutMs");
            }
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          ValueField,
          {
            id: "opencode-go-max-request-image-bytes",
            label: t("maxRequestImageBytesLabel"),
            hint: t("maxRequestImageBytesHint"),
            field: state.maxRequestImageBytes,
            numeric: true,
            ...fieldProps,
            onEdit: (text) => {
              props.edit("maxRequestImageBytes", text);
            },
            onReset: () => {
              props.resetField("maxRequestImageBytes");
            }
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          ValueField,
          {
            id: "opencode-go-image-pixel-budget",
            label: t("requestImagePixelBudgetLabel"),
            hint: t("requestImagePixelBudgetHint"),
            field: state.requestImagePixelBudget,
            numeric: true,
            ...fieldProps,
            onEdit: (text) => {
              props.edit("requestImagePixelBudget", text);
            },
            onReset: () => {
              props.resetField("requestImagePixelBudget");
            }
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          ValueField,
          {
            id: "opencode-go-image-max-bytes",
            label: t("requestImageMaxBytesLabel"),
            hint: t("requestImageMaxBytesHint"),
            field: state.requestImageMaxBytes,
            numeric: true,
            ...fieldProps,
            onEdit: (text) => {
              props.edit("requestImageMaxBytes", text);
            },
            onReset: () => {
              props.resetField("requestImageMaxBytes");
            }
          }
        )
      ] }) : null
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: Section_default.actions, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { variant: "primary", size: "md", disabled: disabled || !state.dirty || state.invalid || state.saving, onClick: props.save, children: state.saving ? t("saving") : t("save") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { variant: "outline", size: "md", disabled: disabled || !state.dirty || state.saving, onClick: props.discard, children: t("discard") }),
      state.failed ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: Section_default.failedNote, children: t("savedFailed") }) : null
    ] }),
    disabled ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: Section_default.hint, children: t("readOnly") }) : null
  ] });
}

// src/client/staged-form.ts
var import_dsh_client_store = require("@deepseek-ai/dsh-client-store");
function numberField(field) {
  return {
    field,
    format: (value) => typeof value === "number" ? String(value) : "",
    parse: (text) => {
      const trimmed = text.trim();
      if (trimmed === "") return { kind: "clear" };
      const parsed = Number(trimmed);
      return Number.isFinite(parsed) ? { kind: "set", value: parsed } : void 0;
    }
  };
}
function booleanField(field) {
  return {
    field,
    format: (value) => typeof value === "boolean" ? String(value) : "",
    parse: (text) => {
      if (text === "true") return { kind: "set", value: true };
      if (text === "false") return { kind: "set", value: false };
      return void 0;
    }
  };
}
function textField(field) {
  return {
    field,
    format: (value) => typeof value === "string" ? value : "",
    parse: (text) => {
      const trimmed = text.trim();
      return trimmed === "" ? { kind: "clear" } : { kind: "set", value: trimmed };
    }
  };
}
var StagedForm = class {
  /**
   * @param scope - the bound settings scope for this page's namespace.
   * @param specs - the section fields this page edits.
   * @param secrets - the page's write-only controls, written outside the section.
   */
  constructor(scope, specs, secrets = []) {
    this.scope = scope;
    this.specs = new Map(specs.map((spec) => [spec.field, spec]));
    this.secretSpecs = new Map(secrets.map((spec) => [spec.field, spec]));
    scope.subscribe(() => {
      this.publish();
    });
  }
  specs;
  secretSpecs;
  staged = /* @__PURE__ */ new Map();
  listeners = /* @__PURE__ */ new Set();
  saving = false;
  failed = false;
  /**
   * Publish a projection of this form, rebuilt whenever the scope or a draft changes.
   * @param project - build the page state from the form's current reads.
   * @returns the store the component reads through its bound selector.
   */
  bind(project) {
    const store = (0, import_dsh_client_store.createSnapshotStore)(project());
    this.listeners.add(() => {
      store.set(project());
    });
    return store;
  }
  /**
   * Read the page-level state: what the Host serves, and what a save would do.
   * @returns the form state the page shell shares.
   */
  shell() {
    const snapshot = this.scope.getSnapshot();
    const plan = this.plan();
    return {
      available: snapshot.status === "ready",
      writable: snapshot.writable,
      dirty: plan.length > 0,
      invalid: plan.some((item) => item.run === void 0),
      saving: this.saving,
      failed: this.failed
    };
  }
  /**
   * Read one control's state.
   * @param field - field name of a section field or of a write-only control.
   * @returns the draft text, whether a save would leave an override, and whether it is invalid.
   */
  field(field) {
    const staged = this.staged.get(field);
    if (this.secretSpecs.has(field)) {
      return { text: staged?.text ?? "", overridden: false, invalid: false };
    }
    const spec = this.spec(field);
    if (staged === void 0) {
      return { text: spec.format(this.sectionValue(field)), overridden: this.stored(field), invalid: false };
    }
    const write = staged.clear ? { kind: "clear" } : spec.parse(staged.text);
    return {
      text: staged.text,
      overridden: write?.kind === "set",
      invalid: write === void 0
    };
  }
  /**
   * Build the edit, reset, save, and discard actions bound to this form.
   * @returns the actions the page's slot entry injects.
   */
  actions() {
    return {
      edit: (field, text) => {
        this.stage(field, { text, clear: false });
      },
      resetField: (field) => {
        this.stage(field, { text: this.spec(field).format(this.baseValue(field)), clear: true });
      },
      save: () => {
        void this.save();
      },
      discard: () => {
        if (this.staged.size === 0 && !this.failed) return;
        this.staged.clear();
        this.failed = false;
        this.publish();
      }
    };
  }
  /**
   * Write every staged edit, then re-seed from what the Host accepted.
   *
   * The Host is the only authority on whether a value was accepted — its
   * validators own the constraints no schema can express — so the outcome is
   * read back from the section rather than predicted here. A save that did not
   * land keeps its drafts, so the user can correct them instead of retyping.
   */
  async save() {
    const plan = this.plan();
    const writes = plan.flatMap((item) => item.run === void 0 ? [] : [item.run]);
    if (plan.length === 0 || this.saving || writes.length !== plan.length) return;
    this.saving = true;
    this.failed = false;
    this.publish();
    let landed = true;
    for (const write of writes) {
      landed = await write() && landed;
    }
    if (landed) this.staged.clear();
    this.saving = false;
    this.failed = !landed;
    this.publish();
  }
  /**
   * Every staged edit a save would write. An entry whose draft is not a value
   * its field accepts carries no write: the form is still dirty, and the save
   * refuses rather than dropping the edit.
   * @returns the planned writes, in the order the fields were staged.
   */
  plan() {
    const plan = [];
    for (const [field, staged] of this.staged) {
      const secret = this.secretSpecs.get(field);
      if (secret !== void 0) {
        const value = staged.text.trim();
        if (value !== "") plan.push({ field, run: () => secret.write(value) });
        continue;
      }
      const spec = this.spec(field);
      if (staged.clear) {
        if (this.stored(field)) plan.push({ field, run: () => this.clear(field) });
        continue;
      }
      if (staged.text === spec.format(this.sectionValue(field))) continue;
      const write = spec.parse(staged.text);
      if (write === void 0) plan.push({ field, run: void 0 });
      else if (write.kind === "clear") plan.push({ field, run: () => this.clear(field) });
      else plan.push({ field, run: () => this.store(field, write.value) });
    }
    return plan;
  }
  async clear(field) {
    await this.scope.unset(field);
    return !this.stored(field);
  }
  async store(field, value) {
    await this.scope.set(field, value);
    return this.userLayer()?.[field] === value;
  }
  stage(field, edit) {
    this.staged.set(field, edit);
    this.failed = false;
    this.publish();
  }
  spec(field) {
    const spec = this.specs.get(field);
    if (spec === void 0) throw new Error(`opencode-go settings page has no field ${field}`);
    return spec;
  }
  snapshotOf() {
    return this.scope.getSnapshot();
  }
  sectionValue(field) {
    return this.snapshotOf().value?.[field];
  }
  baseValue(field) {
    return this.snapshotOf().base?.[field];
  }
  userLayer() {
    return this.snapshotOf().user;
  }
  stored(field) {
    const user = this.userLayer();
    return user !== void 0 && Object.hasOwn(user, field);
  }
  publish() {
    for (const listener of this.listeners) listener();
  }
};

// src/client/section-controller.ts
var OPENCODE_GO_NS = "llm-opencode-go";
var DEFAULT_API_KEY_REF = "OPENCODE_API_KEY";
var API_KEY_FIELD = "apiKey";
var OPENCODE_GO_PROVIDER = "opencode-go";
var MODEL_PREVIEW_LIMIT = 6;
var OpencodeGoSectionController = class {
  /**
   * @param scope - the bound settings scope for the `llm-opencode-go` namespace.
   * @param ctx - the page plugin's context, whose `remote.credentials` namespace
   *   answers for the credential the section references.
   */
  constructor(scope, ctx) {
    this.scope = scope;
    this.ctx = ctx;
    this.form = new StagedForm(
      scope,
      [
        // Present so the shared override/reset machinery tracks the field; the
        // page's switch writes it directly instead of staging it.
        booleanField("enabled"),
        textField("apiKeyEnv"),
        textField("baseURL"),
        // The same immediate-write switch as `enabled` owns this field.
        booleanField("autoDiscover"),
        numberField("refreshMinutes"),
        numberField("streamIdleTimeoutMs"),
        numberField("maxRequestImageBytes"),
        numberField("requestImagePixelBudget"),
        numberField("requestImageMaxBytes")
      ],
      [{ field: API_KEY_FIELD, write: (text) => this.writeKey(text) }]
    );
    this.store = this.form.bind(() => this.projection());
    scope.subscribe(() => {
      void this.readCredential();
    });
    void this.readCredential();
  }
  form;
  store;
  credential = { ref: "", configured: false, writable: true };
  models = { status: "idle" };
  modelsRequest = 0;
  face;
  projection() {
    return {
      ...this.form.shell(),
      enabled: this.enabled(),
      autoDiscover: this.autoDiscover(),
      apiKeyEnv: this.form.field("apiKeyEnv"),
      baseURL: this.form.field("baseURL"),
      refreshMinutes: this.form.field("refreshMinutes"),
      streamIdleTimeoutMs: this.form.field("streamIdleTimeoutMs"),
      maxRequestImageBytes: this.form.field("maxRequestImageBytes"),
      requestImagePixelBudget: this.form.field("requestImagePixelBudget"),
      requestImageMaxBytes: this.form.field("requestImageMaxBytes"),
      apiKey: this.form.field(API_KEY_FIELD),
      apiKeyConfigured: this.credential.configured,
      apiKeyWritable: this.credential.writable,
      models: this.models
    };
  }
  /**
   * The adapter's effective switch state: the resolved section's value, over
   * the Host's own default when the section carries none.
   * @returns whether the route is currently served.
   */
  enabled() {
    return this.scope.getSnapshot().value?.enabled ?? true;
  }
  /**
   * Flip the switch by writing the field on the click itself.
   *
   * This is the one control on the page that does not wait for Save: the point
   * of turning it off is to watch the models leave the pickers, and the point
   * of turning it back on is to use the route again — staging either behind a
   * second gesture would report a state the Host does not hold. The write is
   * revision-fenced by the scope like every other, and a refusal surfaces as a
   * failed save through the shared shell rather than a silent revert.
   * @param next - the state the switch asks for.
   */
  setEnabled(next) {
    void this.scope.set("enabled", next);
  }
  /**
   * The auto-discovery switch's effective state, over the Host's default when
   * the section carries none.
   * @returns whether unknown live ids are adapted onto the route.
   */
  autoDiscover() {
    return this.scope.getSnapshot().value?.autoDiscover ?? true;
  }
  /**
   * Flip the auto-discovery switch by writing the field on the click itself,
   * mirroring {@link OpencodeGoSectionController.setEnabled}: the listing the
   * switch governs is displayed right above it, and the write is what the
   * user is trying to observe on the next refresh.
   * @param next - the state the switch asks for.
   */
  setAutoDiscover(next) {
    void this.scope.set("autoDiscover", next);
  }
  /**
   * Read the gateway's model listing through the Host's discovery for this
   * adapter. Called when the page mounts and again from its refresh control.
   * A rejection settles as a failure too: the refresh control is disabled
   * while loading and the next read starts only from `idle`, so leaving the
   * state loading would strand the page with no way to ask the gateway again.
   */
  loadModels() {
    const request = ++this.modelsRequest;
    this.models = { status: "loading" };
    this.store.set(this.projection());
    void this.ctx.remote.llm.discoverModels(OPENCODE_GO_NS, { provider: OPENCODE_GO_PROVIDER }).then((response) => {
      if (request !== this.modelsRequest) return;
      this.models = response.ok ? {
        status: "ready",
        count: response.value.length,
        preview: response.value.slice(0, MODEL_PREVIEW_LIMIT).map((model) => model.name ?? model.id)
      } : { status: "failed", message: response.error.message };
      this.store.set(this.projection());
    }).catch((error) => {
      if (request !== this.modelsRequest) return;
      this.models = { status: "failed", message: error instanceof Error ? error.message : String(error) };
      this.store.set(this.projection());
    });
  }
  /**
   * Ask the credentials domain about the reference the section currently names.
   *
   * The answer is stored with the reference it describes: `apiKeyEnv` can
   * change between the request and its response, and two reads can settle out
   * of order, so a response is published only while it still answers for the
   * reference in force.
   */
  async readCredential() {
    const ref = refOf(this.scope.getSnapshot());
    if (ref !== this.credential.ref) {
      this.credential = { ref, configured: false, writable: true };
      this.store.set(this.projection());
    }
    const response = await this.ctx.remote.credentials.describe([ref]);
    if (!response.ok || ref !== refOf(this.scope.getSnapshot())) return;
    const view = response.value[ref];
    const next = {
      ref,
      configured: view?.configured ?? false,
      // An unknown reference is treated as writable: the control stays usable
      // and the Host is what refuses, rather than the page guessing a refusal.
      writable: view?.writable ?? true
    };
    if (next.configured === this.credential.configured && next.writable === this.credential.writable) return;
    this.credential = next;
    this.store.set(this.projection());
  }
  /**
   * Re-read after the Host reports a change to the reference this page watches.
   *
   * A key can be written from somewhere else — the Models page addresses the
   * same reference — and the settings section does not change when it is, so
   * without this the badge keeps reporting a state the Host already replaced.
   * @param ref - the reference the Host reports as changed.
   */
  refreshCredential(ref) {
    if (ref !== this.credential.ref) return;
    void this.readCredential();
  }
  /**
   * Build the face the page's slot registration injects. Built once: the store
   * is what changes, and the renderer binds the same callbacks across renders.
   * @returns the page snapshot and its form actions.
   */
  inject() {
    this.face ??= {
      hooks: { opencodeGo: this.store },
      loadModels: () => {
        this.loadModels();
      },
      setEnabled: (next) => {
        this.setEnabled(next);
      },
      setAutoDiscover: (next) => {
        this.setAutoDiscover(next);
      },
      ...this.form.actions()
    };
    return this.face;
  }
  /**
   * Write the staged key, then re-read whether the Host now holds one.
   * @param value - the staged credential literal.
   * @returns whether the Host reports a configured credential afterwards.
   */
  async writeKey(value) {
    await this.ctx.remote.credentials.set(refOf(this.scope.getSnapshot()), value);
    await this.readCredential();
    return this.credential.configured;
  }
};
function refOf(snapshot) {
  const declared = snapshot.value?.apiKeyEnv;
  return declared !== void 0 && declared.length > 0 ? declared : DEFAULT_API_KEY_REF;
}

// src/client/locales.ts
var en = {
  usageTitle: "OpenCode Go usage",
  usageHint: "Account usage \xB7 used percentage \xB7 refreshes every minute",
  usageWeekShort: "week",
  usage_rolling: "5 hours",
  usage_weekly: "Weekly",
  usage_monthly: "Monthly",
  usageResets: "Resets",
  usageLimited: "Limit reached",
  usageLoading: "Loading usage\u2026",
  usageUnavailable: "Unavailable",
  nav: "OpenCode Go",
  title: "OpenCode Go",
  intro: "Use your OpenCode Go subscription in the harness. Paste the API key below and save; the models the gateway currently serves are listed underneath.",
  enabledLabel: "Enable OpenCode Go",
  enabledHint: "While this is on, OpenCode Go appears in every model picker and can serve requests. Turning it off withdraws the provider and its models immediately; this page stays reachable so you can turn it back on.",
  enabledOff: "OpenCode Go is off. Its models are withdrawn from every picker and no request reaches the gateway. Turn the switch back on to use it again.",
  enabledUnavailable: "This deployment pins the switch on in its composition, so it cannot be changed here.",
  keyLabel: "API key",
  keyHint: "From your OpenCode Go subscription (opencode.ai). Leaving this blank keeps the key already saved, and a saved key applies to the next request without a restart.",
  keyConfigured: "Key saved",
  keyMissing: "No key yet",
  keyNotWritable: "This key is supplied from outside the settings document (an environment variable, for example), so it cannot be changed here.",
  modelsLabel: "Available models",
  modelsRefresh: "Refresh",
  modelsLoading: "Reading the gateway model list\u2026",
  modelsFailed: "Could not read the gateway model list.",
  modelsEmpty: "The gateway currently serves no model this adapter can route.",
  modelsCount: "{count} models",
  autoDiscoverLabel: "Auto-adapt new models",
  autoDiscoverHint: "Models the gateway serves before any catalog describes them are added automatically, cloning the wire protocol and capacities of their closest known sibling. Effective on the next catalog refresh; a wrong guess fails only that model, never the rest of the route.",
  autoDiscoverOff: "New gateway models appear only once a catalog release describes them. Turn this on to let the adapter adapt them automatically.",
  advancedLabel: "Advanced settings",
  advancedHint: "Credential name, gateway URL, and adapter tuning. The inherited values work as they are; change them only if you know you need to.",
  apiKeyEnvLabel: "Credential reference",
  apiKeyEnvHint: "The name the key is resolved from, addressed through the credentials service.",
  baseURLLabel: "Gateway URL",
  baseURLHint: "The endpoint that serves requests and the live model list.",
  refreshMinutesLabel: "Catalog refresh (minutes)",
  refreshMinutesHint: "How long one live model-listing resolution stays authoritative before re-fetching.",
  streamIdleTimeoutMsLabel: "Stream idle timeout (ms)",
  streamIdleTimeoutMsHint: "Largest quiet gap between stream events before the request fails.",
  maxRequestImageBytesLabel: "Request image payload cap (bytes)",
  maxRequestImageBytesHint: "Accumulated base64 image payload bound for one request.",
  requestImagePixelBudgetLabel: "Image pixel budget",
  requestImagePixelBudgetHint: "Total-pixel budget for one converted request image.",
  requestImageMaxBytesLabel: "Image byte target (bytes)",
  requestImageMaxBytesHint: "Raw encoded-byte target for one request image before base64 expansion.",
  overridden: "Customized",
  reset: "Reset to default",
  invalidValue: "Not a valid value",
  save: "Save",
  discard: "Discard",
  saving: "Saving\u2026",
  savedFailed: "The last save did not land as staged; correct the values or discard.",
  readOnly: "The settings document is read-only in this deployment.",
  unavailable: "The OpenCode Go settings are not served in this deployment."
};
var zh = {
  usageTitle: "OpenCode Go \u7528\u91CF",
  usageHint: "\u8D26\u53F7\u989D\u5EA6 \xB7 \u5DF2\u7528\u767E\u5206\u6BD4 \xB7 \u6BCF\u5206\u949F\u5237\u65B0",
  usageWeekShort: "\u5468",
  usage_rolling: "5 \u5C0F\u65F6",
  usage_weekly: "\u6BCF\u5468",
  usage_monthly: "\u6BCF\u6708",
  usageResets: "\u91CD\u7F6E\u4E8E",
  usageLimited: "\u5DF2\u8FBE\u9650\u989D",
  usageLoading: "\u6B63\u5728\u8BFB\u53D6\u7528\u91CF\u2026",
  usageUnavailable: "\u6682\u4E0D\u53EF\u7528",
  nav: "OpenCode Go",
  title: "OpenCode Go",
  intro: "\u5728 Harness \u4E2D\u4F7F\u7528\u4F60\u7684 OpenCode Go \u8BA2\u9605\u3002\u586B\u5165\u4E0B\u65B9 API key \u5E76\u4FDD\u5B58\u5373\u53EF\uFF1B\u7F51\u5173\u5F53\u524D\u63D0\u4F9B\u7684\u6A21\u578B\u5217\u5728\u4E0B\u9762\u3002",
  enabledLabel: "\u542F\u7528 OpenCode Go",
  enabledHint: "\u5F00\u542F\u65F6\uFF0COpenCode Go \u4F1A\u51FA\u73B0\u5728\u6240\u6709\u6A21\u578B\u9009\u62E9\u5668\u4E2D\u5E76\u53EF\u5904\u7406\u8BF7\u6C42\u3002\u5173\u95ED\u540E\u5C06\u7ACB\u5373\u64A4\u4E0B\u8BE5\u63D0\u4F9B\u65B9\u53CA\u5176\u6A21\u578B\uFF1B\u672C\u9875\u4ECD\u53EF\u8BBF\u95EE\uFF0C\u65B9\u4FBF\u4F60\u968F\u65F6\u91CD\u65B0\u5F00\u542F\u3002",
  enabledOff: "OpenCode Go \u5DF2\u5173\u95ED\u3002\u5176\u6A21\u578B\u5DF2\u4ECE\u6240\u6709\u9009\u62E9\u5668\u4E2D\u64A4\u4E0B\uFF0C\u4E5F\u4E0D\u4F1A\u6709\u8BF7\u6C42\u53D1\u5F80\u7F51\u5173\u3002\u9700\u8981\u65F6\u628A\u5F00\u5173\u91CD\u65B0\u6253\u5F00\u5373\u53EF\u3002",
  enabledUnavailable: "\u6B64\u90E8\u7F72\u5728\u7EC4\u5408\u5C42\u56FA\u5B9A\u5F00\u542F\u4E86\u8BE5\u5F00\u5173\uFF0C\u65E0\u6CD5\u5728\u6B64\u4FEE\u6539\u3002",
  keyLabel: "API key",
  keyHint: "\u6765\u81EA\u4F60\u7684 OpenCode Go \u8BA2\u9605\uFF08opencode.ai\uFF09\u3002\u7559\u7A7A\u8868\u793A\u4FDD\u6301\u5DF2\u4FDD\u5B58\u7684 key\uFF1B\u4FDD\u5B58\u540E\u4E0B\u4E00\u6B21\u8BF7\u6C42\u5373\u751F\u6548\uFF0C\u65E0\u9700\u91CD\u542F\u3002",
  keyConfigured: "\u5DF2\u914D\u7F6E key",
  keyMissing: "\u5C1A\u672A\u914D\u7F6E",
  keyNotWritable: "\u8BE5 key \u7531\u8BBE\u7F6E\u6587\u6863\u4E4B\u5916\u7684\u6765\u6E90\u63D0\u4F9B\uFF08\u4F8B\u5982\u73AF\u5883\u53D8\u91CF\uFF09\uFF0C\u65E0\u6CD5\u5728\u6B64\u4FEE\u6539\u3002",
  modelsLabel: "\u53EF\u7528\u6A21\u578B",
  modelsRefresh: "\u5237\u65B0",
  modelsLoading: "\u6B63\u5728\u8BFB\u53D6\u7F51\u5173\u6A21\u578B\u5217\u8868\u2026",
  modelsFailed: "\u672A\u80FD\u8BFB\u53D6\u7F51\u5173\u6A21\u578B\u5217\u8868\u3002",
  modelsEmpty: "\u7F51\u5173\u5F53\u524D\u6CA1\u6709\u672C\u9002\u914D\u5668\u53EF\u8DEF\u7531\u7684\u6A21\u578B\u3002",
  modelsCount: "{count} \u4E2A\u6A21\u578B",
  autoDiscoverLabel: "\u81EA\u52A8\u9002\u914D\u65B0\u6A21\u578B",
  autoDiscoverHint: "\u7F51\u5173\u65B0\u4E0A\u7EBF\u3001\u76EE\u5F55\u5C1A\u672A\u6536\u5F55\u7684\u6A21\u578B\u4F1A\u81EA\u52A8\u52A0\u5165\uFF1A\u514B\u9686\u540C\u65CF\u6700\u63A5\u8FD1\u7684\u5DF2\u77E5\u6A21\u578B\u7684\u534F\u8BAE\u4E0E\u53C2\u6570\uFF0C\u5728\u4E0B\u4E00\u6B21\u76EE\u5F55\u5237\u65B0\u540E\u751F\u6548\u3002\u5373\u4F7F\u63A8\u65AD\u6709\u8BEF\uFF0C\u4E5F\u53EA\u5F71\u54CD\u8BE5\u6A21\u578B\u672C\u8EAB\uFF0C\u4E0D\u5F71\u54CD\u5176\u4ED6\u6A21\u578B\u3002",
  autoDiscoverOff: "\u65B0\u6A21\u578B\u9700\u7B49\u5F85\u76EE\u5F55\u7248\u672C\u6536\u5F55\u540E\u624D\u4F1A\u51FA\u73B0\u3002\u6253\u5F00\u6B64\u5F00\u5173\u53EF\u8BA9\u9002\u914D\u5668\u81EA\u52A8\u9002\u914D\u3002",
  advancedLabel: "\u9AD8\u7EA7\u8BBE\u7F6E",
  advancedHint: "\u51ED\u8BC1\u540D\u79F0\u3001\u7F51\u5173\u5730\u5740\u4E0E\u9002\u914D\u5668\u8C03\u4F18\u53C2\u6570\u3002\u7EE7\u627F\u6765\u7684\u53D6\u503C\u5373\u53EF\u6B63\u5E38\u4F7F\u7528\uFF0C\u9664\u975E\u4F60\u660E\u786E\u77E5\u9053\u9700\u8981\u4FEE\u6539\uFF0C\u5426\u5219\u4E0D\u5FC5\u52A8\u8FD9\u91CC\u3002",
  apiKeyEnvLabel: "\u51ED\u8BC1\u5F15\u7528\u540D",
  apiKeyEnvHint: "key \u89E3\u6790\u6240\u4F9D\u636E\u7684\u5F15\u7528\u540D\uFF0C\u7ECF\u51ED\u8BC1\u670D\u52A1\u5BFB\u5740\u3002",
  baseURLLabel: "\u7F51\u5173\u5730\u5740",
  baseURLHint: "\u540C\u65F6\u63D0\u4F9B\u6A21\u578B\u8BF7\u6C42\u4E0E\u5B9E\u65F6\u6A21\u578B\u5217\u8868\u7684\u7AEF\u70B9\u3002",
  refreshMinutesLabel: "\u76EE\u5F55\u5237\u65B0\uFF08\u5206\u949F\uFF09",
  refreshMinutesHint: "\u4E00\u6B21\u5B9E\u65F6\u6A21\u578B\u5217\u8868\u89E3\u6790\u4FDD\u6301\u6709\u6548\u7684\u65F6\u957F\uFF0C\u5230\u671F\u540E\u91CD\u65B0\u62C9\u53D6\u3002",
  streamIdleTimeoutMsLabel: "\u6D41\u7A7A\u95F2\u8D85\u65F6\uFF08\u6BEB\u79D2\uFF09",
  streamIdleTimeoutMsHint: "\u6D41\u4E8B\u4EF6\u95F4\u5141\u8BB8\u7684\u6700\u5927\u9759\u9ED8\u95F4\u9694\uFF0C\u8D85\u51FA\u540E\u8BF7\u6C42\u5931\u8D25\u3002",
  maxRequestImageBytesLabel: "\u8BF7\u6C42\u56FE\u7247\u8F7D\u8377\u4E0A\u9650\uFF08\u5B57\u8282\uFF09",
  maxRequestImageBytesHint: "\u5355\u4E2A\u8BF7\u6C42\u7D2F\u8BA1 base64 \u56FE\u7247\u8F7D\u8377\u7684\u4E0A\u9650\u3002",
  requestImagePixelBudgetLabel: "\u56FE\u7247\u50CF\u7D20\u9884\u7B97",
  requestImagePixelBudgetHint: "\u5355\u5F20\u8F6C\u6362\u540E\u8BF7\u6C42\u56FE\u7247\u7684\u603B\u50CF\u7D20\u9884\u7B97\u3002",
  requestImageMaxBytesLabel: "\u56FE\u7247\u5B57\u8282\u76EE\u6807\uFF08\u5B57\u8282\uFF09",
  requestImageMaxBytesHint: "\u5355\u5F20\u8BF7\u6C42\u56FE\u7247 base64 \u6269\u5C55\u524D\u7684\u539F\u59CB\u7F16\u7801\u5B57\u8282\u76EE\u6807\u3002",
  overridden: "\u5DF2\u81EA\u5B9A\u4E49",
  reset: "\u6062\u590D\u9ED8\u8BA4",
  invalidValue: "\u4E0D\u662F\u6709\u6548\u503C",
  save: "\u4FDD\u5B58",
  discard: "\u653E\u5F03",
  saving: "\u4FDD\u5B58\u4E2D\u2026",
  savedFailed: "\u4E0A\u6B21\u4FDD\u5B58\u672A\u6309\u8349\u7A3F\u751F\u6548\uFF1B\u8BF7\u4FEE\u6B63\u6570\u503C\u6216\u653E\u5F03\u4FEE\u6539\u3002",
  readOnly: "\u6B64\u90E8\u7F72\u4E2D\u8BBE\u7F6E\u6587\u6863\u4E3A\u53EA\u8BFB\u3002",
  unavailable: "\u6B64\u90E8\u7F72\u672A\u63D0\u4F9B OpenCode Go \u8BBE\u7F6E\u3002"
};

// src/usage-contract.ts
function parseGoUsage(value) {
  if (!value || typeof value !== "object") throw new Error("Invalid OpenCode Go usage response");
  const source = value;
  const result = {};
  for (const key of ["rolling", "weekly", "monthly"]) {
    const row = source[key];
    if (!row || row.status !== "ok" && row.status !== "rate-limited" || typeof row.percent !== "number" || !Number.isFinite(row.percent) || row.percent < 0 || typeof row.resetsAt !== "string" || !Number.isFinite(Date.parse(row.resetsAt))) {
      throw new Error("Invalid OpenCode Go usage response");
    }
    result[key] = { status: row.status, percent: row.percent, resetsAt: row.resetsAt };
  }
  return result;
}
var usageCodec = {
  mode: "strict",
  typeSymbol: "dsh-opencode-go#GoUsage",
  schema: { parse: parseGoUsage },
  create: () => ({ parse: parseGoUsage })
};
var usageRemote = {
  package: "dsh-opencode-go",
  descriptors: [{
    id: "dsh-opencode-go#opencodeGoUsage/read",
    service: "opencodeGoUsage",
    namespace: "opencodeGoUsage",
    method: "read",
    invocation: { kind: "direct" },
    parameters: [],
    result: usageCodec
  }]
};

// src/client/UsagePill.tsx
var import_react2 = require("react");

// plugin-css:D:\data\data_traework\deepseek\dsh-opencode-go-live\src\client\UsagePill.module.css
var id2 = "dsh-opencode-go/UsagePill.module.css";
if (!document.querySelector("style[data-plugin-css=" + JSON.stringify(id2) + "]")) {
  const style = document.createElement("style");
  style.dataset.plugin = "dsh-opencode-go";
  style.dataset.pluginCss = id2;
  style.textContent = "._6B12MW_root{min-width:0;display:inline-flex;position:relative}._6B12MW_trigger{color:inherit;opacity:.75;font:inherit;cursor:pointer;white-space:nowrap;background:0 0;border:0;border-radius:6px;padding:4px 6px;font-size:12px}._6B12MW_trigger:hover,._6B12MW_trigger:focus-visible{opacity:1;background:color-mix(in srgb, currentColor 8%, transparent)}._6B12MW_panel{z-index:100;border:1px solid color-mix(in srgb, currentColor 18%, transparent);width:280px;max-width:calc(100vw - 32px);color:var(--dsw-alias-label-primary,CanvasText);background:var(--dsw-specific-menu,Canvas);border-radius:12px;padding:16px;font-size:12px;position:absolute;bottom:calc(100% + 12px);right:0;box-shadow:0 8px 30px #0002}._6B12MW_hint{opacity:.65;font-size:11px;line-height:1.6}._6B12MW_window{margin-top:14px}._6B12MW_row{justify-content:space-between;margin-bottom:5px;display:flex}._6B12MW_window progress{accent-color:#39a878;width:100%;height:5px;margin-bottom:5px;display:block}._6B12MW_window progress::-webkit-progress-bar{background:color-mix(in srgb, currentColor 15%, transparent);border-radius:4px}._6B12MW_window progress::-webkit-progress-value{background:#39a878;border-radius:4px}._6B12MW_window progress::-moz-progress-bar{background:#39a878;border-radius:4px}";
  document.head.appendChild(style);
}
var UsagePill_default = { "root": "_6B12MW_root", "panel": "_6B12MW_panel", "hint": "_6B12MW_hint", "row": "_6B12MW_row", "window": "_6B12MW_window", "trigger": "_6B12MW_trigger" };

// src/client/UsagePill.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
function UsagePill({ directory, ...props }) {
  const state = (0, import_react2.useSyncExternalStore)(directory.subscribe, directory.getSnapshot, directory.getSnapshot);
  return ["opencode-go", "opencode-go-plus"].includes(state.current?.provider) ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(ActiveUsage, { ...props }) : null;
}
function ActiveUsage({ readUsage, t }) {
  const [usage, setUsage] = (0, import_react2.useState)(null);
  const [failed, setFailed] = (0, import_react2.useState)(false);
  const [open, setOpen] = (0, import_react2.useState)(false);
  const root = (0, import_react2.useRef)(null);
  (0, import_react2.useEffect)(() => {
    let alive = true;
    let busy = false;
    const refresh = async () => {
      if (busy || document.visibilityState === "hidden") return;
      busy = true;
      try {
        const value = await readUsage();
        if (alive) {
          setUsage(value);
          setFailed(false);
        }
      } catch {
        if (alive) {
          setUsage(null);
          setFailed(true);
        }
      } finally {
        busy = false;
      }
    };
    void refresh();
    const timer = setInterval(() => {
      void refresh();
    }, 6e4);
    const visible = () => {
      void refresh();
    };
    document.addEventListener("visibilitychange", visible);
    return () => {
      alive = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [readUsage]);
  (0, import_react2.useEffect)(() => {
    if (!open) return;
    const click = (event) => {
      if (!root.current?.contains(event.target)) setOpen(false);
    };
    const key = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", click);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", click);
      document.removeEventListener("keydown", key);
    };
  }, [open]);
  const label = usage ? `Go \xB7 5h ${usage.rolling.percent}% \xB7 ${t("usageWeekShort")} ${usage.weekly.percent}%` : `Go \xB7 ${failed ? t("usageUnavailable") : "\u2026"}`;
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: UsagePill_default.root, ref: root, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      "button",
      {
        type: "button",
        className: UsagePill_default.trigger,
        "aria-expanded": open,
        "aria-haspopup": "dialog",
        "aria-label": `${t("usageTitle")}: ${label}`,
        onClick: () => {
          setOpen(!open);
        },
        children: label
      }
    ),
    open && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: UsagePill_default.panel, role: "dialog", "aria-label": t("usageTitle"), children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("strong", { children: t("usageTitle") }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: UsagePill_default.hint, children: t("usageHint") }),
      usage ? ["rolling", "weekly", "monthly"].map((key) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: UsagePill_default.window, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: UsagePill_default.row, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: t(`usage_${key}`) }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("strong", { children: [
            usage[key].percent,
            "%"
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("progress", { "aria-label": t(`usage_${key}`), max: 100, value: Math.min(100, usage[key].percent) }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: UsagePill_default.hint, children: [
          t("usageResets"),
          " ",
          new Date(usage[key].resetsAt).toLocaleString()
        ] }),
        usage[key].status === "rate-limited" && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { children: t("usageLimited") })
      ] }, key)) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { children: failed ? t("usageUnavailable") : t("usageLoading") })
    ] })
  ] });
}

// src/client/usage.ts
function registerUsagePill(ctx) {
  ctx.inject(["modelDirectories", "sessions", "remote.session"], (scope) => {
    scope.effect(async () => {
      const unmount = await scope.remote.$mount(usageRemote);
      scope.inject(["remote.opencodeGoUsage"], (ready) => {
        const readUsage = async () => {
          const result = await ready.remote.opencodeGoUsage.read();
          if (!result.ok) throw new Error("OpenCode Go usage unavailable");
          return result.value;
        };
        const translate = ready.locale.bind("settings.opencode-go");
        ready.slots.inject("conversation.input.right", () => ready.slots.register({
          name: "conversation.input.right",
          id: "opencode-go-usage",
          order: 1e3,
          inject: (sessionId) => ({
            directory: ready.modelDirectories.directoryFor(sessionId).store,
            readUsage,
            t: (key) => translate(key)
          })
        }, UsagePill));
      });
      return unmount;
    });
  });
}

// BEGIN GENERATED CONNECTION CARD
var connectionCardModule = (() => { var module = { exports: {} }; var exports = module.exports;
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// scripts/client/connection-card.jsx
var connection_card_exports = {};
__export(connection_card_exports, {
  ConnectionCard: () => ConnectionCard,
  registerConnectionCard: () => registerConnectionCard
});
module.exports = __toCommonJS(connection_card_exports);
var import_react = __toESM(require("react"), 1);

// lib/connection-contract.js
var states = /* @__PURE__ */ new Set(["missing", "configured", "ready", "unauthorized", "forbidden", "limited", "unavailable", "models-unavailable"]);
function parseConnectionStatus(value) {
  if (!value || typeof value !== "object" || !states.has(value.connection)) throw new Error("Invalid connection status");
  for (const name of ["configured", "writable", "enabled"]) if (typeof value[name] !== "boolean") throw new Error("Invalid connection status");
  for (const name of ["ref", "route"]) if (typeof value[name] !== "string") throw new Error("Invalid connection status");
  for (const name of ["modelCount", "checkedAt", "httpStatus"]) if (!Number.isFinite(value[name]) || value[name] < 0) throw new Error("Invalid connection status");
  return Object.fromEntries(["configured", "writable", "enabled", "ref", "route", "connection", "modelCount", "checkedAt", "httpStatus"].map((name) => [name, value[name]]));
}
var codec = { mode: "strict", typeSymbol: "dsh-opencode-go-plus-connection#ConnectionStatus", schema: { parse: parseConnectionStatus }, create: () => ({ parse: parseConnectionStatus }) };
var connectionRemote = {
  package: "dsh-opencode-go-plus-connection",
  descriptors: ["status", "refresh"].map((method) => ({
    id: `dsh-opencode-go-plus-connection#opencodeGoConnection/${method}`,
    service: "opencodeGoConnection",
    namespace: "opencodeGoConnection",
    method,
    invocation: { kind: "direct" },
    parameters: [],
    result: codec
  }))
};

// scripts/client/connection-controller.js
var ConnectionController = class {
  constructor(actions) {
    this.actions = actions;
    this.state = { status: null, busy: "", error: "", saved: false };
    this.listeners = /* @__PURE__ */ new Set();
    this.generation = 0;
    this.disposed = false;
  }
  subscribe = (listener) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  getSnapshot = () => this.state;
  publish(patch) {
    if (this.disposed) return;
    this.state = { ...this.state, ...patch };
    for (const listener of this.listeners) listener();
  }
  async run(kind, key) {
    if (this.disposed || this.state.busy) return false;
    const generation = ++this.generation;
    this.publish({ busy: kind, error: "", saved: false });
    let saved = false;
    try {
      if (kind === "save") {
        const value = key.trim();
        if (!/^[\x21-\x7e]+$/.test(value)) throw new Error("invalid-key");
        const current = await this.actions.status();
        if (!current.writable) throw new Error("read-only");
        await this.actions.set(current.ref, value);
        saved = true;
        this.publish({ saved: true });
      }
      const status = await (kind === "read" ? this.actions.status() : this.actions.refresh());
      if (generation === this.generation) this.publish({ status });
      return saved;
    } catch (error) {
      if (generation === this.generation) this.publish({ error: ["invalid-key", "read-only"].includes(error.message) ? error.message : saved ? "saved-refresh-failed" : kind === "save" ? "save-failed" : "refresh-failed" });
      return saved;
    } finally {
      if (generation === this.generation) this.publish({ busy: "" });
    }
  }
  activate() {
    this.disposed = false;
    ++this.generation;
    this.publish({ busy: "" });
  }
  read = () => this.run("read");
  refresh = () => this.run("refresh");
  save = (key) => this.run("save", key);
  dispose() {
    this.disposed = true;
    ++this.generation;
    this.listeners.clear();
  }
};

// scripts/client/connection-card.jsx
var NS = "opencode-go.connection";
var zh = {
  help: "\u767B\u5F55 OpenCode \u5B98\u7F51\u4E0D\u4F1A\u81EA\u52A8\u8FDE\u63A5 Harness\u3002\u8BF7\u5728 OpenCode \u63A7\u5236\u53F0\u83B7\u53D6 Go API Key\uFF0C\u5E76\u4FDD\u5B58\u5230\u8FD9\u91CC\u3002",
  console: "\u6253\u5F00 OpenCode \u63A7\u5236\u53F0",
  label: "OpenCode Go API Key",
  placeholder: "\u7C98\u8D34 API Key",
  stored: "\u5DF2\u4FDD\u5B58\uFF1B\u7559\u7A7A\u4FDD\u7559\u73B0\u6709\u5BC6\u94A5",
  save: "\u4FDD\u5B58\u5E76\u68C0\u67E5",
  refresh: "\u5237\u65B0\u72B6\u6001",
  busy: "\u6B63\u5728\u68C0\u67E5\u2026",
  saving: "\u6B63\u5728\u4FDD\u5B58\u2026",
  loading: "\u6B63\u5728\u8BFB\u53D6\u72B6\u6001\u2026",
  saved: "\u5BC6\u94A5\u5DF2\u4FDD\u5B58\u3002",
  locked: "\u6B64\u5BC6\u94A5\u7531\u73AF\u5883\u6216\u53EA\u8BFB\u914D\u7F6E\u63D0\u4F9B\uFF0C\u4E0D\u80FD\u5728\u8FD9\u91CC\u8986\u76D6\u3002",
  disabled: "\u63D2\u4EF6\u5DF2\u505C\u7528\uFF1B\u8BF7\u5148\u542F\u7528\u63D2\u4EF6\u914D\u7F6E\u4E2D\u7684 enabled\uFF0C\u518D\u4F7F\u7528\u6A21\u578B\u3002",
  missing: "\u672A\u914D\u7F6E API Key\uFF1B\u5B98\u7F51\u767B\u5F55\u72B6\u6001\u4E0D\u80FD\u4EE3\u66FF\u5BC6\u94A5\u3002",
  configured: "\u5DF2\u914D\u7F6E\u5BC6\u94A5\uFF0C\u5C1A\u672A\u68C0\u67E5\u8FDE\u63A5\u3002\u70B9\u51FB\u201C\u5237\u65B0\u72B6\u6001\u201D\u9A8C\u8BC1\u3002",
  ready: "\u8BA4\u8BC1\u6210\u529F\uFF0C\u6A21\u578B\u76EE\u5F55\u5DF2\u5237\u65B0\u3002\u53EF\u7528\u6A21\u578B\uFF1A",
  empty: "\u8BA4\u8BC1\u6210\u529F\uFF0C\u4F46\u5F53\u524D\u76EE\u5F55\u6CA1\u6709\u53EF\u7528\u6A21\u578B\uFF0C\u8BF7\u68C0\u67E5 Go \u8BA2\u9605\u6216\u7A0D\u540E\u5237\u65B0\u3002",
  unauthorized: "\u8BA4\u8BC1\u5931\u8D25\uFF08401\uFF09\uFF1A\u8BF7\u68C0\u67E5\u6216\u66F4\u6362 API Key\u3002",
  forbidden: "\u8BBF\u95EE\u88AB\u62D2\u7EDD\uFF08403\uFF09\uFF1A\u8BF7\u68C0\u67E5 Go \u8BA2\u9605\u4E0E\u8BE5\u5BC6\u94A5\u7684\u6743\u9650\u3002",
  limited: "\u670D\u52A1\u9650\u6D41\uFF08429\uFF09\uFF1A\u8BF7\u7A0D\u540E\u91CD\u8BD5\uFF0C\u5E76\u68C0\u67E5\u8BA2\u9605\u7528\u91CF\u3002",
  unavailable: "\u6682\u65F6\u65E0\u6CD5\u9A8C\u8BC1\u8FDE\u63A5\uFF1B\u8BF7\u68C0\u67E5\u7F51\u7EDC\u6216\u670D\u52A1\u72B6\u6001\u540E\u91CD\u8BD5\u3002\u8FD9\u4E0D\u4EE3\u8868\u5BC6\u94A5\u672A\u4FDD\u5B58\u3002",
  "models-unavailable": "\u8BA4\u8BC1\u6210\u529F\uFF0C\u4F46\u5B9E\u65F6\u6A21\u578B\u76EE\u5F55\u5237\u65B0\u5931\u8D25\uFF1B\u6682\u65F6\u4F7F\u7528\u5185\u7F6E\u76EE\u5F55\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u3002",
  "invalid-key": "\u8BF7\u8F93\u5165\u6709\u6548\u7684 API Key\uFF0C\u4E0D\u80FD\u5305\u542B\u7A7A\u683C\u6216\u6362\u884C\u3002",
  "read-only": "\u5F53\u524D\u51ED\u636E\u4E0D\u53EF\u5199\uFF0C\u672A\u4FDD\u5B58\u3002",
  "save-failed": "\u4FDD\u5B58\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u684C\u9762\u8FDE\u63A5\u548C\u51ED\u636E\u5199\u5165\u6743\u9650\u540E\u91CD\u8BD5\u3002",
  "refresh-failed": "\u65E0\u6CD5\u8BFB\u53D6\u6700\u65B0\u72B6\u6001\uFF0C\u8BF7\u786E\u8BA4\u63D2\u4EF6\u5DF2\u542F\u7528\u5E76\u91CD\u65B0\u8FDE\u63A5\u540E\u518D\u8BD5\u3002",
  "saved-refresh-failed": "\u5BC6\u94A5\u5DF2\u4FDD\u5B58\uFF0C\u4F46\u72B6\u6001\u68C0\u67E5\u5931\u8D25\uFF0C\u8BF7\u70B9\u51FB\u201C\u5237\u65B0\u72B6\u6001\u201D\u91CD\u8BD5\u3002",
  checked: "\u6700\u8FD1\u68C0\u67E5\uFF1A",
  editHint: "\u8BF7\u4F7F\u7528\u672C\u5361\u7247\u914D\u7F6E\u5BC6\u94A5\uFF1B\u4E0A\u65B9\u901A\u7528\u201C\u7F16\u8F91\u201D\u6682\u4E0D\u652F\u6301\u6B64\u63D2\u4EF6\u3002"
};
var en = {
  help: "Signing in to the OpenCode website does not connect Harness. Copy your Go API key from the OpenCode console and save it here.",
  console: "Open OpenCode console",
  label: "OpenCode Go API Key",
  placeholder: "Paste API key",
  stored: "Stored; leave blank to keep the current key",
  save: "Save and check",
  refresh: "Refresh status",
  busy: "Checking\u2026",
  saving: "Saving\u2026",
  loading: "Reading status\u2026",
  saved: "API key saved.",
  locked: "This credential comes from an environment or read-only configuration and cannot be overwritten here.",
  disabled: "This plugin is disabled. Enable its enabled setting before using models.",
  missing: "No API key configured. Website sign-in does not supply an API key.",
  configured: "API key configured; connection not checked. Refresh status to verify.",
  ready: "Authenticated and model catalog refreshed. Available models: ",
  empty: "Authenticated, but no models are available. Check your Go subscription or refresh later.",
  unauthorized: "Authentication failed (401). Check or replace the API key.",
  forbidden: "Access denied (403). Check your Go subscription and key permissions.",
  limited: "Rate limited (429). Retry later and check subscription usage.",
  unavailable: "Could not verify the connection. Check your network or service status and retry. Your stored key has not been removed.",
  "models-unavailable": "Authenticated, but live model discovery failed. Using the bundled catalog; retry later.",
  "invalid-key": "Enter an API key without whitespace or line breaks.",
  "read-only": "This credential is read-only. Nothing was saved.",
  "save-failed": "Could not save. Check the desktop connection and credential write permissions.",
  "refresh-failed": "Could not read status. Ensure the plugin is enabled and reconnect, then retry.",
  "saved-refresh-failed": "Key saved, but the check failed. Refresh status to retry.",
  checked: "Last checked: ",
  editHint: "Configure the key in this card; the generic Edit control above does not support this plugin yet."
};
var css = `.ocg-connection{display:grid;gap:12px;padding-top:16px;font-size:13px;line-height:1.6;color:var(--dsw-alias-label-primary, #202326)}.ocg-connection p{margin:0}.ocg-connection a{color:var(--dsw-alias-brand-primary,#2458ce)}.ocg-connection label{display:grid;gap:6px;font-weight:500}.ocg-connection input{width:100%;box-sizing:border-box;min-height:40px;border:1px solid var(--dsw-alias-border-l4,#ccc);border-radius:8px;padding:8px 12px;color:inherit;background:var(--dsw-alias-bg-layer-3,#fff);font:inherit}.ocg-actions{display:flex;gap:10px;flex-wrap:wrap}.ocg-actions button{min-height:36px;border:1px solid var(--dsw-alias-border-l4,#ccc);border-radius:8px;padding:6px 14px;background:var(--dsw-alias-bg-layer-3,#fff);color:inherit;font:inherit;cursor:pointer}.ocg-actions button:first-child{background:var(--dsw-alias-brand-primary,#2458ce);color:#fff;border-color:transparent}.ocg-actions button:disabled{opacity:.5;cursor:default}.ocg-status{border-radius:8px;padding:10px 12px;background:var(--dsw-alias-bg-layer-2,#f5f6f7)}.ocg-status[data-tone=success]{border-left:3px solid #269267}.ocg-status[data-tone=warning]{border-left:3px solid #ca8a20}.ocg-note{color:var(--dsw-alias-label-secondary,#656b73);font-size:12px}.ocg-connection :focus-visible{outline:2px solid var(--dsw-alias-brand-primary,#2458ce);outline-offset:2px}`;
function ConnectionCard({ actions, subscribeUpdates, t }) {
  const [controller] = (0, import_react.useState)(() => new ConnectionController(actions));
  const state = (0, import_react.useSyncExternalStore)(controller.subscribe, controller.getSnapshot);
  const [key, setKey] = (0, import_react.useState)("");
  (0, import_react.useEffect)(() => {
    controller.activate();
    void controller.read();
    const unsubscribe = subscribeUpdates(() => {
      void controller.read();
    });
    return () => {
      unsubscribe();
      controller.dispose();
    };
  }, [controller, subscribeUpdates]);
  const status = state.status;
  const locked = status?.writable === false;
  const good = status?.connection === "ready" && status.modelCount > 0;
  const message = !status ? t("loading") : status.connection === "ready" ? status.modelCount ? `${t("ready")}${status.modelCount}` : t("empty") : t(status.connection);
  const save = async (event) => {
    event.preventDefault();
    if (await controller.save(key)) setKey("");
  };
  return /* @__PURE__ */ import_react.default.createElement("form", { className: "ocg-connection", onSubmit: save, "aria-label": "OpenCode Go" }, /* @__PURE__ */ import_react.default.createElement("p", null, t("help"), " ", /* @__PURE__ */ import_react.default.createElement("a", { href: "https://opencode.ai/zen", target: "_blank", rel: "noopener noreferrer" }, t("console"))), /* @__PURE__ */ import_react.default.createElement("div", { className: "ocg-status", "data-tone": good ? "success" : "warning", role: "status", "aria-live": "polite" }, message), status && !status.enabled && /* @__PURE__ */ import_react.default.createElement("p", null, t("disabled")), /* @__PURE__ */ import_react.default.createElement("label", null, t("label"), /* @__PURE__ */ import_react.default.createElement("input", { type: "password", "aria-label": t("label"), autoComplete: "new-password", spellCheck: false, value: key, placeholder: t(status?.configured ? "stored" : "placeholder"), disabled: Boolean(state.busy) || !status || locked, onChange: (event) => setKey(event.target.value) })), locked && /* @__PURE__ */ import_react.default.createElement("p", { className: "ocg-note" }, t("locked")), /* @__PURE__ */ import_react.default.createElement("div", { className: "ocg-actions" }, /* @__PURE__ */ import_react.default.createElement("button", { type: "submit", disabled: Boolean(state.busy) || !status || locked || !key.trim() }, t(state.busy === "save" ? "saving" : "save")), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", disabled: Boolean(state.busy), onClick: () => {
    void controller.refresh();
  } }, t(state.busy === "refresh" ? "busy" : "refresh"))), state.saved && !state.error && /* @__PURE__ */ import_react.default.createElement("p", { role: "status" }, t("saved")), state.error && /* @__PURE__ */ import_react.default.createElement("p", { role: "alert" }, t(state.error)), Boolean(status?.checkedAt) && /* @__PURE__ */ import_react.default.createElement("p", { className: "ocg-note" }, t("checked"), new Date(status.checkedAt).toLocaleString()), /* @__PURE__ */ import_react.default.createElement("p", { className: "ocg-note" }, t("editHint")));
}
function registerConnectionCard(ctx) {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }));
  ctx.effect(() => {
    const tag = document.createElement("style");
    tag.textContent = css;
    document.head.appendChild(tag);
    return () => tag.remove();
  });
  ctx.inject(["remote.credentials"], (scope) => {
    scope.effect(async () => {
      const unmount = await scope.remote.$mount(connectionRemote);
      scope.inject(["remote.opencodeGoConnection"], (ready) => {
        const read = async (method) => {
          const response = await ready.remote.opencodeGoConnection[method]();
          if (!response.ok) throw new Error("status-unavailable");
          return parseConnectionStatus(response.value);
        };
        const actions = {
          status: () => read("status"),
          refresh: () => read("refresh"),
          set: async (ref, value) => {
            const result = await ready.remote.credentials.set(ref, value);
            if (!result.ok) throw new Error("save-failed");
          }
        };
        const subscribeUpdates = (listener) => {
          const disposers = ["credentials/reference-updated", "settings/document-updated"].map((event) => ready.remote.$on(event, listener));
          disposers.push(ready.on("connection/reset", listener));
          return () => {
            for (const dispose of disposers) dispose();
          };
        };
        const t = ready.locale.bind(NS);
        ready.slots.inject("settings.models.provider-card", () => ready.slots.register({
          name: "settings.models.provider-card",
          key: "llm-opencode-go",
          inject: () => ({ actions, subscribeUpdates, t })
        }, ConnectionCard));
      });
      return unmount;
    });
  });
}

return module.exports; })();
// END GENERATED CONNECTION CARD

// src/client/index.ts
//
// The standalone "Settings -> OpenCode Go" section this file used to register
// is GONE: the route now has a row of its own on the Settings -> Models page
// (declared by the host half through `llm.registerConfigurableProviders`), and
// that row's editor is the Models page's own provider card. Two configuration
// surfaces for one route was the thing this change removed, so the section
// registration and the settings scope that fed it were dropped together.
//
// The composer usage pill remains. Since 0.4.2, the keyed provider-card slot
// also supplies credential editing because the native editor recognizes only
// built-in adapter namespaces.
var NS = "settings.opencode-go";
var inject = ["slots", "locale", "remote", "remote.session", "modelDirectories", "sessions"];
function apply(ctx) {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), "llm-opencode-go: copy dictionaries");
  registerUsagePill(ctx);
  connectionCardModule.registerConnectionCard(ctx);
}
return module.exports; } });
