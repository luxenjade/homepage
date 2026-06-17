---
title: 構文テスト
date: 2026-02-23
description: 全構文の表示確認用サンプル。
thumbnail: https://picsum.photos/1200/500
category: developer
components.katex: true
components.highlight: true
published: true
---

# 見出しテスト

## h2 見出し

### h3 見出し

---

## テキスト装飾

通常のテキストです。**太字**、_イタリック_、**_太字イタリック_**、`インラインコード` のテスト。

==ハイライト== のテストです。

---

## 引用

> これは引用文です。
> 複数行の引用もまとめて1つのblockquoteになります。

---

## リスト

### 箇条書き

- りんご
- バナナ
- みかん
  - ネストされた項目
  - さらにネスト
    - 3段目

### 番号付きリスト

1. 最初のステップ
2. 次のステップ
3. 最後のステップ
   1. サブステップA
   2. サブステップB

### チェックボックス

- [x] 完了したタスク
- [ ] 未完了のタスク
- [x] これも完了

---

## 表

| 言語       | 用途     | 難易度 |
| ---------- | -------- | ------ |
| HTML       | 構造     | 易しい |
| CSS        | デザイン | 普通   |
| JavaScript | 動作     | 難しい |

---

## コードブロック

```js
function greet(name) {
  return `Hello, ${name}!`;
}

console.log(greet("World"));
```

```python
def greet(name):
    return f"Hello, {name}!"

print(greet("World"))
```

---

## 画像

![サンプル画像](https://picsum.photos/600/300)

---

## 数式

インライン数式： $E = mc^2$

ブロック数式：

$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$

$$
\frac{d}{dx} \sin(x) = \cos(x)
$$

---

## リンク

[Googleへのリンク](https://www.google.com)

---

## 複合テスト

表の中にインライン要素：

| 機能         | 説明               |
| ------------ | ------------------ |
| **太字**     | 強調したいテキスト |
| `code`       | インラインコード   |
| _イタリック_ | 斜体テキスト       |
