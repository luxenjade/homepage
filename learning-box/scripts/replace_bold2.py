import os
import re

# ==========================================
# 設定（CONFIG）
# ==========================================
# 処理したいフォルダのパスをここに入力してください。
# 例1 (同じフォルダ): TARGET_DIR = '.'
# 例2 (絶対パス):   TARGET_DIR = 'C:/Users/username/Documents/Notes'
# 例3 (Mac/Linux): TARGET_DIR = '/Users/username/Documents/Notes'
TARGET_DIR = 'src/notes/geo-2026-1-mid'

# ==========================================

def replace_bold_in_md(folder_path):
    # 正規表現パターン: **テキスト** または __テキスト__ にマッチ
    bold_pattern = re.compile(r'(\*\*|__)(.*?)\1', re.DOTALL)
    processed_count = 0

    for root, dirs, files in os.walk(folder_path):
        for file in files:
            if file.endswith('.md'):
                file_path = os.path.join(root, file)
                
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # 太字部分を ⟦⟦ テキスト ⟧⟧ に置換
                    new_content = bold_pattern.sub(r'⟦⟦\2⟧⟧', content)
                    
                    if content != new_content:
                        with open(file_path, 'w', encoding='utf-8') as f:
                            f.write(new_content)
                        print(f"置換完了: {file_path}")
                        processed_count += 1
                        
                except Exception as e:
                    print(f"エラー発生 ({file}): {e}")
                    
    return processed_count

if __name__ == "__main__":
    # パスの存在チェック
    if not os.path.exists(TARGET_DIR):
        print(f"エラー: 指定されたフォルダが見つかりません。パスを確認してください: {TARGET_DIR}")
    else:
        print(f"対象フォルダ: {os.path.abspath(TARGET_DIR)}")
        print("置換処理を開始します...")
        
        count = replace_bold_in_md(TARGET_DIR)
        
        print(f"すべての処理が終了しました。（変更ファイル数: {count}）")