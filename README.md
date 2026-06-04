# Racehorse Wordle

競走馬版 Wordle の静的 Web アプリです。`index.html` を直接開いても動くように、問題データは `data/questions.embedded.js` に埋め込んでいます。

## 使い方

- 直接開く: `index.html`
- ローカルサーバー: `npm run serve` → `http://localhost:4173`
- テスト: `npm test`
- データ生成: `npm run generate:data`
- データ検証: `npm run validate:data`

## データ範囲

1990年1月1日以降、2026年6月4日時点までに日本国内で施行された平地 GI/G1/JpnI を勝った日本調教馬を対象にします。J-GI、海外G1、外国調教馬、昇格前勝ち馬は出題対象外です。

初期データは JRA 公式の過去 G1 成績ページを主軸に自動生成し、地方 GI/JpnI は Wikipedia の歴代優勝馬表と競走馬 infobox を補助ソースとして照合します。生成時の監査情報は `data/race-wins.audit.json` に残ります。
