# Third-Party Notices

`@ledgerhq/wallet-cli` is compiled with [bun](https://bun.sh) into a single
self-contained executable. The list below covers the third-party software
**embedded in that binary** that imposes attribution requirements on this
package's redistribution.

The wallet-cli source code itself is licensed under Apache License 2.0; see
the `LICENSE` file shipped alongside this notice for the full text.

## Bundled third-party software

| Package | Version | License | Copyright |
|---|---|---|---|
| [`bignumber.js`](https://github.com/MikeMcl/bignumber.js) | 9.1.2 | MIT | Copyright (c) 2023 Michael Mclaughlin |
| [`debug`](https://github.com/debug-js/debug) | 4.4.3 | MIT | Copyright (c) 2014-2017 TJ Holowaychuk; Copyright (c) 2018-2021 Josh Junon |
| [`purify-ts`](https://github.com/gigobyte/purify) | 2.1.0 | ISC | Copyright (c) 2018, Stanislav Iliev |
| [`rxjs`](https://github.com/reactivex/rxjs) | 7.8.2 | Apache-2.0 | Copyright (c) 2015-2018 Google, Inc., Netflix, Inc., Microsoft Corp. and contributors |
| [`usb`](https://github.com/node-usb/node-usb) | 2.17.0 | MIT | Copyright (c) 2012 Nonolith Labs, LLC |
| [`yocto-spinner`](https://github.com/sindresorhus/yocto-spinner) | 0.2.0 | MIT | Copyright (c) Sindre Sorhus |
| [`zod`](https://github.com/colinhacks/zod) | 4.3.6 | MIT | Copyright (c) 2025 Colin McDonnell |

The full MIT and ISC license texts are reproduced at the bottom of this file.
For `rxjs` (Apache-2.0), the same Apache-2.0 v2.0 text shipped in the
`LICENSE` file alongside this notice applies; `rxjs` does not ship a separate
`NOTICE` file.

## Ledger workspace code (Apache-2.0)

The following packages declared in `apps/wallet-cli/package.json` are part of
the Ledger Live monorepo, copyright Ledger SAS, licensed under Apache-2.0 —
the same license already covered by the `LICENSE` file shipped alongside this
notice:

`@ledgerhq/coin-bitcoin`, `@ledgerhq/coin-evm`, `@ledgerhq/coin-module-framework`,
`@ledgerhq/coin-solana`, `@ledgerhq/cryptoassets`, `@ledgerhq/device-management-kit`,
`@ledgerhq/errors`, `@ledgerhq/hw-app-exchange`, `@ledgerhq/hw-transport`,
`@ledgerhq/ledger-wallet-framework`, `@ledgerhq/live-common`,
`@ledgerhq/live-config`, `@ledgerhq/live-dmk-shared`, `@ledgerhq/live-env`,
`@ledgerhq/live-wallet`, `@ledgerhq/logs`, `@ledgerhq/types-cryptoassets`,
`@ledgerhq/types-devices`, `@ledgerhq/types-live`, `@shared/schema-primitives`.

The 4 platform companion packages — `@ledgerhq/wallet-cli-darwin-arm64`,
`@ledgerhq/wallet-cli-linux-arm64`, `@ledgerhq/wallet-cli-linux-x64`,
`@ledgerhq/wallet-cli-windows-x64` — carry the same wallet-cli binary and are
also Apache-2.0.

## License texts

### MIT License

```
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### ISC License

```
Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
```
