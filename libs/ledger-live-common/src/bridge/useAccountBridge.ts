import { use } from "react";
import { getAccountBridge } from ".";
import type {
  Account,
  AccountLike,
  ResolvedAccountBridge,
  TransactionCommon,
} from "@ledgerhq/types-live";

// Requires a <Suspense> boundary in the parent tree.
export function useAccountBridge<T extends TransactionCommon>(
  account: AccountLike,
  parentAccount?: Account | null,
): ResolvedAccountBridge<T> {
  return use(getAccountBridge(account, parentAccount) as Promise<ResolvedAccountBridge<T>>);
}

// Null-safe variant: returns null when account is null.
// use() can be called conditionally (unlike regular React hooks).
export function useAccountBridgeOrNull<T extends TransactionCommon>(
  account: AccountLike | null,
  parentAccount?: Account | null,
): ResolvedAccountBridge<T> | null {
  if (!account) return null;
  return use(getAccountBridge(account, parentAccount) as Promise<ResolvedAccountBridge<T>>);
}

// Multi-account variant. use() is allowed in loops (unlike regular hooks). See https://react.dev/reference/react/use
export function useAccountBridgeMany(accounts: Account[]): ResolvedAccountBridge<any>[] {
  return accounts.map(a => use(getAccountBridge(a) as Promise<ResolvedAccountBridge<any>>));
}
