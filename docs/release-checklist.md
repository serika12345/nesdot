# リリース runbook

## 前提

- すべてのコマンドは Nix dev shell 内で実行する
- リリース対象は常に `main` 上の commit である
- `Deploy Desktop Release` は `main` 上で version を確定し、その commit に `vX.Y.Z` タグを付ける
- GitHub へ push できる状態であること
- GitHub Actions secret `TAURI_SIGNING_PRIVATE_KEY` が設定済みであること
- updater private key に password を付けている場合は `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` も設定済みであること
- ワーキングツリーが clean であること
- `main` checkout 済みで、`origin/main` に fast-forward できること

## VS Code からの標準フロー

- `main` に checkout し、`git pull --ff-only origin main` で最新化する
- `Terminal: Run Task` から `Verify CI` を実行する
- `Terminal: Run Task` から `Release Desktop Dry Run` を実行し、`patch / minor / major` を選ぶ
- dry run の出力で次バージョン、実行予定の verify コマンド、付与される tag を確認する
- 問題がなければ `Terminal: Run Task` から `Deploy Desktop Release` を実行し、同じ bump 種別を選ぶ
- 実行後は GitHub Actions の `release-tauri-desktop` と `deploy-pages` を確認する
- desktop release は asset upload 完了まで draft のまま保持され、最後に publish される

## 実行内容

`Deploy Desktop Release` は次をまとめて実行する。

- `pnpm verify:ci`
- `package.json`
- `src-tauri/tauri.conf.json`
- `src-tauri/Cargo.toml`
- `src-tauri/Cargo.lock`
- `flake.nix` に紐づく pnpm deps hash
- `pnpm release:auto -- --skip-checks`
- `main` への version bump commit push
- `vX.Y.Z` タグ push

`main` push により GitHub Pages の deploy が走り、`vX.Y.Z` タグ push により desktop release workflow が走る。desktop release workflow は tag が `main` 系列の commit を指している場合にだけ実行を継続する。

## リリース前チェックリスト

- [ ] 主要ブランチ最新化・競合解消済み
- [ ] 変更内容のテスト・レビュー完了
- [ ] `pnpm format:check` パス
- [ ] `pnpm lint` パス
- [ ] `pnpm typecheck:safety` パス
- [ ] `pnpm verify:security` パス
- [ ] `pnpm test` パス
- [ ] UI変更時: `pnpm test:e2e:console` パス
- [ ] UI表示/操作フロー変更時: `pnpm test:e2e` パス
- [ ] Rust/Tauri変更時: `pnpm verify:rust` パス
- [ ] macOS Tauri/CSP変更時: `pnpm verify:tauri:csp` パス
- [ ] 依存更新時: `pnpm verify:licenses` パス
- [ ] Linux system library変更時: `pnpm verify:system-libraries` パス
- [ ] CVE監査: `pnpm verify:cve` パス
- [ ] CI/CDフル検証: `pnpm verify:ci` パス
- [ ] 通常 CI の macOS job で `pnpm verify:tauri:csp` パス
- [ ] `nix build` がローカルで成功し、`result/bin/nesdot` が生成される
- [ ] バージョン・tag・manifest の整合性確認
- [ ] リリースノート作成

## リリース後チェックリスト

- [ ] GitHub Actions `release-tauri-desktop` が green
- [ ] GitHub Actions `deploy-pages` が green
- [ ] GitHub Release に macOS / Linux / Windows artifact と `latest.json` が作成されている
- [ ] GitHub Release が draft 解除され publish 済みである
- [ ] Pages の最新デプロイが main の commit を反映している
- [ ] 既存 desktop アプリから更新確認ができる

## 失敗時の扱い

- dry run が失敗した場合は修正してからやり直す
- `Release Desktop` 実行後に GitHub へ push 済みなら、履歴を書き換えて戻すより follow-up commit で修正する
- 既に公開した tag や release を消す対応は最終手段とし、必要な場合だけ明示的に行う
- `main` 以外や detached HEAD から tag を付ける運用はしない

## 備考

- shell から実行する場合は `docs/development-manual.md` の release 節を参照
- VS Code task も内部では `nix develop -c zsh -lc '...'` を使う
- CI での自動検証結果はリリース完了条件に含める
