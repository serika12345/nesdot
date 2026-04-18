# リリース前チェックリスト

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
- [ ] `nix build` がローカルで成功し、`result/bin/nesdot` が生成される
- [ ] バージョン・タグ・manifestの整合性確認
- [ ] リリースノート作成

## 備考

- すべてNix dev shell内で実行すること
- 詳細な手順・コマンドはREADME参照
- CIでの自動検証も必ず確認
