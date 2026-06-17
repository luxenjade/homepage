---
title: markdownファイルの例
date: 2026-01-28
excerpt: この記事はパスワードで保護されています。
category: developer
read_time: 5
password: example
components.katex: false
components.highlight: true
---

# サンプルドキュメント

このページでは、Markdownファイルを表示する方法を示します。

### 見出しの例

#### レベル3の見出し

##### レベル4の見出し

通常のテキストはこのように表示されます。**太字**や*イタリック*も使えます。

### リストの例

#### 箇条書きリスト

- 項目1
- 項目2
  - サブ項目2-1
  - サブ項目2-2
- 項目3

#### 番号付きリスト

1. 最初のステップ
2. 次のステップ
3. 最後のステップ

### コードの例

インラインコードは`const x = 10;`のように表示されます。

```javascript
// JavaScriptのコードブロック
function greet(name) {
  console.log(`Hello, ${name}!`);
}

greet("World");
```

```python
# Pythonのコードブロック
def calculate_sum(a, b):
    return a + b

result = calculate_sum(5, 3)
print(f"Result: {result}")
```

### 引用の例

> これは引用文です。重要な情報や
> 引用したい内容をこのように表示できます。

### リンクの例

[Google](https://www.google.com)へのリンクや、[内部ページ](index.html)へのリンクも設定できます。

### 表の例

| 項目  | 説明    | 価格   |
| ----- | ------- | ------ |
| 商品A | 説明文A | ¥1,000 |
| 商品B | 説明文B | ¥2,000 |
| 商品C | 説明文C | ¥3,000 |

### 水平線

以下のように区切り線を入れることもできます。

---

## まとめ

このように、Markdownファイルをウェブページ上でシームレスに表示できます。
スタイリングは`common.css`のテーマと統合されているため、
ダークモード/ライトモードの切り替えにも対応しています。
