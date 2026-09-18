/**
 * The OpenCode Go settings page's staged form over the `llm-opencode-go`
 * settings namespace, plus the gateway model listing the page reports.
 *
 * The key is the one control that does not live in the section: its literal
 * never rides a response, so the page learns only whether one is configured
 * and writes it through the credentials domain, addressed by the reference the
 * section names. It is still staged with the rest of the form, so one save
 * covers everything the page shows.
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis';
import type { SnapshotStore } from '@deepseek-ai/dsh-client-store';
import type { SettingsScope } from '@deepseek-ai/dsh-client-ui-settings/client';
import { type FieldState, type FormActions, type FormShell } from './staged-form.ts';
/** Namespace of the OpenCode Go adapter. Spelled here rather than imported: a client package must not depend on a Host package. */
export declare const OPENCODE_GO_NS = "llm-opencode-go";
/** The adapter fields this page edits. */
export interface OpencodeGoSettings {
    /** Whether the adapter serves its route; false withdraws it from every picker. */
    enabled?: boolean;
    /** Credential reference naming the environment key. */
    apiKeyEnv?: string;
    /** The gateway endpoint; also the live listing base. */
    baseURL?: string;
    /** Whether unknown live ids are adapted from their family's sibling. */
    autoDiscover?: boolean;
    /** Live catalog re-resolution interval, in minutes. */
    refreshMinutes?: number;
    /** Largest idle gap between stream events, in milliseconds. */
    streamIdleTimeoutMs?: number;
    /** Accumulated base64 image payload bound for one request. */
    maxRequestImageBytes?: number;
    /** Total-pixel budget for one request image. */
    requestImagePixelBudget?: number;
    /** Raw encoded-byte target for one request image. */
    requestImageMaxBytes?: number;
}
/** The gateway's model listing as the page reports it. */
export type OpencodeGoModels = 
/** Not asked for yet; the page asks once it mounts. */
{
    readonly status: 'idle';
}
/** A listing request is outstanding. */
 | {
    readonly status: 'loading';
}
/** The gateway answered: how many models it serves, and a preview of their names. */
 | {
    readonly status: 'ready';
    readonly count: number;
    readonly preview: readonly string[];
}
/** The listing could not be read; `message` is the Host's own diagnostic. */
 | {
    readonly status: 'failed';
    readonly message: string;
};
/** What the settings page renders. */
export interface OpencodeGoSectionState extends FormShell {
    /**
     * Whether the adapter currently serves its route. Resolved from the section
     * rather than staged: the switch writes on the click that flips it, because
     * a withdrawn route is what the user is trying to observe.
     */
    enabled: boolean;
    /**
     * Whether unknown live ids are adapted onto the route. Resolved and written
     * the same immediate way as `enabled`: the switch is what the user is
     * observing, next to the model listing it changes.
     */
    autoDiscover: boolean;
    /** Credential reference naming the environment key. */
    apiKeyEnv: FieldState;
    /** The gateway endpoint. */
    baseURL: FieldState;
    /** Live catalog re-resolution interval, in minutes. */
    refreshMinutes: FieldState;
    /** Largest idle gap between stream events, in milliseconds. */
    streamIdleTimeoutMs: FieldState;
    /** Accumulated base64 image payload bound for one request. */
    maxRequestImageBytes: FieldState;
    /** Total-pixel budget for one request image. */
    requestImagePixelBudget: FieldState;
    /** Raw encoded-byte target for one request image. */
    requestImageMaxBytes: FieldState;
    /** The staged credential, which starts blank on every load. */
    apiKey: FieldState;
    /** Whether the Host reports a credential configured for the referenced key. */
    apiKeyConfigured: boolean;
    /** Whether the credentials domain accepts a write for it; false disables the control. */
    apiKeyWritable: boolean;
    /** The gateway's current model listing. */
    models: OpencodeGoModels;
}
/** The registration-side face the page's slot entry injects. */
export interface OpencodeGoSectionFace extends FormActions {
    hooks: {
        /** Page snapshot bound by the UI renderer as useOpencodeGo. */
        opencodeGo: SnapshotStore<OpencodeGoSectionState>;
    };
    /** Read the gateway's model listing, now or again after a failure. */
    loadModels: () => void;
    /**
     * Turn the adapter's route on or off, writing immediately.
     * @param next - the state the switch asks for.
     */
    setEnabled: (next: boolean) => void;
    /**
     * Turn auto-discovery on or off, writing immediately.
     * @param next - the state the switch asks for.
     */
    setAutoDiscover: (next: boolean) => void;
}
/** Bridges the `llm-opencode-go` scope and the credentials domain onto the page. */
export declare class OpencodeGoSectionController {
    private readonly scope;
    private readonly ctx;
    private readonly form;
    private readonly store;
    private credential;
    private models;
    private modelsRequest;
    private face;
    /**
     * @param scope - the bound settings scope for the `llm-opencode-go` namespace.
     * @param ctx - the page plugin's context, whose `remote.credentials` namespace
     *   answers for the credential the section references.
     */
    constructor(scope: SettingsScope<OpencodeGoSettings>, ctx: ClientContext);
    private projection;
    /**
     * The adapter's effective switch state: the resolved section's value, over
     * the Host's own default when the section carries none.
     * @returns whether the route is currently served.
     */
    private enabled;
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
    setEnabled(next: boolean): void;
    /**
     * The auto-discovery switch's effective state, over the Host's default when
     * the section carries none.
     * @returns whether unknown live ids are adapted onto the route.
     */
    private autoDiscover;
    /**
     * Flip the auto-discovery switch by writing the field on the click itself,
     * mirroring {@link OpencodeGoSectionController.setEnabled}: the listing the
     * switch governs is displayed right above it, and the write is what the
     * user is trying to observe on the next refresh.
     * @param next - the state the switch asks for.
     */
    setAutoDiscover(next: boolean): void;
    /**
     * Read the gateway's model listing through the Host's discovery for this
     * adapter. Called when the page mounts and again from its refresh control.
     * A rejection settles as a failure too: the refresh control is disabled
     * while loading and the next read starts only from `idle`, so leaving the
     * state loading would strand the page with no way to ask the gateway again.
     */
    loadModels(): void;
    /**
     * Ask the credentials domain about the reference the section currently names.
     *
     * The answer is stored with the reference it describes: `apiKeyEnv` can
     * change between the request and its response, and two reads can settle out
     * of order, so a response is published only while it still answers for the
     * reference in force.
     */
    private readCredential;
    /**
     * Re-read after the Host reports a change to the reference this page watches.
     *
     * A key can be written from somewhere else — the Models page addresses the
     * same reference — and the settings section does not change when it is, so
     * without this the badge keeps reporting a state the Host already replaced.
     * @param ref - the reference the Host reports as changed.
     */
    refreshCredential(ref: string): void;
    /**
     * Build the face the page's slot registration injects. Built once: the store
     * is what changes, and the renderer binds the same callbacks across renders.
     * @returns the page snapshot and its form actions.
     */
    inject(): OpencodeGoSectionFace;
    /**
     * Write the staged key, then re-read whether the Host now holds one.
     * @param value - the staged credential literal.
     * @returns whether the Host reports a configured credential afterwards.
     */
    private writeKey;
}
