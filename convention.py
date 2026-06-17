import os
import re
import sys


def parse_markdown_file(file_path):
    """Markdownファイルを読み込み、Frontmatterと本文を分離して辞書型で返す"""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            output_content = f.read()
    except Exception as e:
        print(
            f"[-] ファイルの読み込みに失敗しました ({file_path}): {e}",
            file=sys.stderr,
        )
        return None, None

    # Frontmatter (--- で囲まれた部分) を抽出
    frontmatter_match = re.match(
        r"^---\s*\n(.*?)\n---\s*\n(.*)", output_content, re.DOTALL
    )

    meta = {}
    content = output_content

    if frontmatter_match:
        frontmatter_text = frontmatter_match.group(1)
        content = frontmatter_match.group(2).strip()

        # 各行をパース
        for line in frontmatter_text.split("\n"):
            if ":" in line:
                key, val = line.split(":", 1)
                meta[key.strip()] = val.strip().strip('"').strip("'")

    # Frontmatterにslugがない場合はファイル名（拡張子なし）をslugにする
    base_name = os.path.splitext(os.path.basename(file_path))[0]
    meta["slug"] = meta.get("slug", base_name)

    return meta, content


def escape_sql_string(text):
    """SQL文の文字列エスケープ処理"""
    if text is None:
        return "NULL"
    # シングルクォーテーションをエスケープ
    escaped = text.replace("'", "''")
    return f"'{escaped}'"


def build_sql_statements(meta, content):
    """メタデータと本文から対応するSQL文を生成する"""
    slug = meta.get("slug")
    title = meta.get("title", "Untitled")
    date = meta.get("date", None)
    category = meta.get("category", None)
    password = meta.get("password", None)

    statements = []

    if password:
        # 1. パスワードがある場合は保護記事（private）
        excerpt = meta.get("excerpt", None)

        insert_private = f"""INSERT INTO posts_private (slug, title, date, excerpt, category, content)
VALUES (
    {escape_sql_string(slug)},
    {escape_sql_string(title)},
    {escape_sql_string(date)},
    {escape_sql_string(excerpt)},
    {escape_sql_string(category)},
    {escape_sql_string(content)}
)
ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    date = EXCLUDED.date,
    excerpt = EXCLUDED.excerpt,
    category = EXCLUDED.category,
    content = EXCLUDED.content,
    updated_at = now();"""

        insert_password = f"""INSERT INTO posts_password (slug, password)
VALUES (
    {escape_sql_string(slug)},
    {escape_sql_string(password)}
)
ON CONFLICT (slug) DO UPDATE SET
    password = EXCLUDED.password,
    updated_at = now();"""

        statements.append(insert_private)
        statements.append(insert_password)
    else:
        # 2. パスワードがない場合は公開記事（public）
        description = meta.get("description", meta.get("excerpt", None))
        thumbnail = meta.get("thumbnail", None)

        insert_public = f"""INSERT INTO posts_public (slug, title, date, description, category, thumbnail, content)
VALUES (
    {escape_sql_string(slug)},
    {escape_sql_string(title)},
    {escape_sql_string(date)},
    {escape_sql_string(description)},
    {escape_sql_string(category)},
    {escape_sql_string(thumbnail)},
    {escape_sql_string(content)}
)
ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    date = EXCLUDED.date,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    thumbnail = EXCLUDED.thumbnail,
    content = EXCLUDED.content,
    updated_at = now();"""

        statements.append(insert_public)

    return "\n\n".join(statements)


def process_folder(target_dir, output_sql_path):
    """指定されたフォルダを再帰的に探索し、SQLファイルにまとめる"""
    print(f"[+] 探索を開始しますフォルダー: {target_dir}")
    count = 0

    with open(output_sql_path, "w", encoding="utf-8") as out_f:
        # トランザクションを開始して処理を高速・安全に
        out_f.write("BEGIN;\n\n")

        # os.walk でサブフォルダ含め再帰的に探索
        for root, dirs, files in os.walk(target_dir):
            for file in files:
                if file.endswith(".md") or file.endswith(".markdown"):
                    file_path = os.path.join(root, file)

                    meta, content = parse_markdown_file(file_path)
                    if meta is None:
                        continue

                    sql_text = build_sql_statements(meta, content)

                    out_f.write(f"-- Source: {file_path}\n")
                    out_f.write(sql_text)
                    out_f.write("\n\n")
                    count += 1
                    print(f" -> 変換成功: {file_path}")

        out_f.write("COMMIT;\n")

    print(
        f"\n[+] 完了！ {count} 個のファイルを処理し、'{output_sql_path}' に出力しました。"
    )


if __name__ == "__main__":
    # 対象のフォルダパスを設定（例: 'markdown_files_folder'）
    # カレントディレクトリ全体を走査する場合は '.' を指定
    target_folder = "docs_content_temp"
    output_filename = "output.sql"

    if os.path.exists(target_folder):
        process_folder(target_folder, output_filename)
    else:
        print(
            f"エラー: 指定されたフォルダー '{target_folder}' が存在しません。スクリプト内の `target_folder` を書き換えてください。"
        )