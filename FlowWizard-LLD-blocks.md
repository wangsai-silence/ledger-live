# FlowWizard + Send Flow - LLD building blocks

This document explains the Send Flow stack from top to bottom, with a focus on **Ledger Live Desktop (LLD)**.

The goal is to show how coin-specific capabilities flow from **descriptors** down to a concrete **Send screen**, without making the UI branch directly on coin families.

## 1. Coin Descriptors

**Where**

- `libs/ledger-live-common/src/bridge/descriptor/types.ts`
- `libs/ledger-live-common/src/bridge/descriptor/registry.ts`

**Why this block exists**

Descriptors describe what a coin can do. They are the coin-specific source of truth for Send capabilities.

Examples:

- Does this coin support a memo?
- Does it support custom fees?
- Does it support coin control?
- Does the recipient field support domains?
- How should custom fee inputs map back to the transaction?

**How it works**

Each coin family exposes a `CoinDescriptor`. For Send, the relevant part is `SendDescriptor`.

The registry exposes helpers such as `getSendDescriptor(currency)`, so the rest of the app can ask:

> “Given this currency, what Send features are available?”

This keeps coin-specific rules in `live-common`, instead of spreading `family === "bitcoin"` or `family === "evm"` checks across UI components.

## 2. Send UI Config

**Where**

- `libs/ledger-live-common/src/flows/send/uiConfig.ts`

**Why this block exists**

The UI should not consume raw descriptors directly. Descriptors can contain detailed coin-level logic, while screens only need simple display decisions.

This block converts descriptors into a small generic object: `SendFlowUiConfig`.

**How it works**

`getSendUiConfig(currency)` reads the descriptor through `getSendDescriptor(currency)` and exposes generic booleans and metadata:

- `hasMemo`
- `memoType`
- `recipientSupportsDomain`
- `hasFeePresets`
- `hasCustomFees`
- `hasCoinControl`

Screens can then render generic UI from these capabilities.

Example:

> If `hasCoinControl` is true, show the Coin Control entry.  
> If `hasMemo` is true, render the memo UI.  
> The screen does not need to know which coin family caused that behavior.

## 3. Shared Send Business Logic

**Where**

- `libs/ledger-live-common/src/flows/send/hooks/useSendFlowBusinessLogic.ts`

**Why this block exists**

Send business logic is mostly platform-agnostic. Both LLD and LLM need to manage:

- selected account
- transaction state
- recipient
- operation result
- loading / error / success status
- Send UI config from descriptors

Putting this in `live-common` avoids duplicating the same state model on desktop and mobile.

**How it works**

`useSendFlowBusinessLogic()` owns the generic state and receives platform-specific hooks as dependencies:

- `useTransactionHook`
- `useOperationHook`

It also calls `getSendUiConfig(currency)` and exposes `uiConfig` to the flow.

So this block is the bridge between:

- descriptor-driven capabilities
- Send transaction state
- platform-specific operation handling

## 4. LLD Send Business Wrapper

**Where**

- `apps/ledger-live-desktop/src/mvvm/features/Send/hooks/useSendFlowState.ts`

**Why this block exists**

LLD needs to plug desktop-specific implementations into the shared Send business logic.

The shared hook does not know how desktop stores operations, updates accounts, or interacts with desktop-specific state.

**How it works**

The LLD wrapper calls the shared `useSendFlowBusinessLogic()` and injects:

- `useSendFlowTransaction`
- `useSendFlowOperation`

It then adds the desktop `close` callback.

The output is the LLD `SendFlowBusinessContext`.

## 5. Send Flow Context

**Where**

- `apps/ledger-live-desktop/src/mvvm/features/Send/context/SendFlowContext.tsx`

**Why this block exists**

Screens should not receive one huge `...props` object. They should read only the data/actions they need.

This context separates Send business state from navigation concerns.

**How it works**

The provider exposes two focused contexts:

- `useSendFlowData()` for state and UI config
- `useSendFlowActions()` for transaction, operation, status and close actions

It also wraps `FlowWizardProvider`, so the same tree can access:

- Send business data
- FlowWizard navigation data

## 6. Send Flow Config

**Where**

- `apps/ledger-live-desktop/src/mvvm/features/Send/constants.ts`
- `libs/ledger-live-common/src/flows/send/types.ts`

**Why this block exists**

The flow needs a declarative description of its steps.

This replaces ad-hoc arrays of step objects and inline back callbacks from the legacy `Stepper`.

**How it works**

`SEND_FLOW_STEP` defines the step vocabulary:

- `RECIPIENT`
- `AMOUNT`
- `RECENT_HISTORY`
- `CUSTOM_FEES`
- `COIN_CONTROL`
- `SIGNATURE`
- `CONFIRMATION`

`SEND_FLOW_CONFIG` defines:

- `stepOrder`: the order of steps
- `stepConfigs`: metadata per step, such as `canGoBack`, `height`, `floating`, `showTitle`

The config describes the flow structure. It does not render anything by itself.

## 7. Step Registry

**Where**

- `apps/ledger-live-desktop/src/mvvm/features/Send/index.tsx`

**Why this block exists**

The config says **which steps exist**. The registry says **which React component renders each step**.

This separation lets the navigation layer remain generic.

**How it works**

`stepRegistry` maps each `SEND_FLOW_STEP` to a screen component:

- `RECIPIENT` -> `RecipientScreen`
- `AMOUNT` -> `AmountScreen`
- `CUSTOM_FEES` -> `CustomFeesScreen`
- `COIN_CONTROL` -> `CoinControlScreen`
- `SIGNATURE` -> `SignatureScreen`
- `CONFIRMATION` -> `ConfirmationScreen`

The FlowWizard can then resolve the current step into the current screen component.

## 8. Send Flow Orchestrator

**Where**

- `apps/ledger-live-desktop/src/mvvm/features/Send/SendFlowOrchestrator.tsx`

**Why this block exists**

This is the assembly point for the Send flow on LLD.

It connects:

- Send business logic
- Send flow config
- Step registry
- Send context provider
- FlowWizard orchestrator

**How it works**

`SendFlowOrchestrator`:

1. builds the business context through `useSendFlowBusinessLogic()`
2. selects the initial step (`RECIPIENT`)
3. passes `flowConfig`, `stepRegistry`, `contextValue`, and `SendFlowProvider` to `FlowWizardOrchestrator`

It does not render a specific step itself. It delegates that to FlowWizard and the layout.

## 9. FlowWizard Orchestrator

**Where**

- `apps/ledger-live-desktop/src/mvvm/features/FlowWizard/FlowWizardOrchestrator.tsx`
- `apps/ledger-live-desktop/src/mvvm/features/FlowWizard/hooks/useFlowWizardNavigation.ts`
- `apps/ledger-live-desktop/src/mvvm/features/FlowWizard/types.ts`

**Why this block exists**

This is the generic navigation engine for LLD MVVM flows.

It should not know anything about Send, fees, recipients, accounts, or coins.

**How it works**

`FlowWizardOrchestrator` receives:

- `flowConfig`
- `stepRegistry`
- `contextValue`
- `ContextProvider`

It computes:

- current step
- navigation direction
- step history
- current step config
- current step renderer
- navigation actions

It exposes those values through `useFlowWizard()`.

Typical actions:

- `goToStep(step)`
- `goToNextStep()`
- `goToPreviousStep()`
- `canGoBack()`
- `canGoForward()`

## 10. Send Flow Layout

**Where**

- `apps/ledger-live-desktop/src/mvvm/features/Send/components/SendFlowLayout.tsx`

**Why this block exists**

The layout is responsible for the desktop dialog experience.

It owns the visual shell, not the business logic.

**How it works**

`SendFlowLayout` reads:

- current step renderer from `useFlowWizard()`
- current step config from `useFlowWizard()`
- Send state from `useSendFlowData()`

Then it renders:

- the dialog
- the Send header
- the current step component
- height behavior
- success/error visual state
- close tracking

At this level, the current screen is just:

> `const StepComponent = wizard.currentStepRenderer`

## 11. Send Screen

**Where**

- Example: `apps/ledger-live-desktop/src/mvvm/features/Send/screens/Amount/AmountScreen.tsx`

**Why this block exists**

A screen is the lowest visible block. It renders one concrete step of the flow.

It should focus on its own UI and view model, not on global orchestration.

**How it works**

`AmountScreen` calls `useAmountScreen()` to build a view model, then renders `AmountScreenInner`.

It receives generic data such as:

- account
- transaction
- transaction status
- bridge pending / bridge error
- `uiConfig`
- transaction actions
- navigation callbacks such as `onReview` or `onSelectCoinControl`

The important part is that the screen consumes capabilities such as `hasCustomFees` or `hasCoinControl` through `uiConfig`, not through coin-family conditions.

## Full top-to-bottom chain

```text
Coin Descriptor
  -> Send UI Config
    -> Shared Send Business Logic
      -> LLD Send Business Wrapper
        -> Send Flow Context
          -> Send Flow Config
            -> Step Registry
              -> Send Flow Orchestrator
                -> FlowWizard Orchestrator
                  -> Send Flow Layout
                    -> Send Screen
```

## Short summary

Descriptors define **what the coin supports**.

`live-common` turns that into **generic Send state and UI capabilities**.

LLD plugs in desktop-specific transaction and operation handling.

FlowWizard owns **navigation and step rendering**.

Screens render **one step** using generic data, without owning the whole flow.
