import os
import re
import sys
from tkinter import filedialog, messagebox
import tkinter as tk

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
    # Tkinterのルートウィンドウを隠す（ダイアログだけを表示するため）
    root = tk.Tk()
    root.withdraw()

    # 1. ユーザーに注意喚起の確認ダイアログを表示
    ans = messagebox.askyesno(
        "確認", 
        "ファイルを直接上書き置換します。\n対象フォルダのバックアップは取りましたか？"
    )
    if not ans:
        print("処理をキャンセルしました。バックアップを取ってから再実行してください。")
        sys.exit()

    # 2. フォルダ選択ダイアログを表示
    target_folder = filedialog.askdirectory(title="対象のフォルダを選択してください")
    
    # フォルダが選択されなかった場合（キャンセル時）
    if not target_folder:
        print("フォルダが選択されなかったため、処理を中止しました。")
        sys.exit()

    print(f"選択されたフォルダ: {target_folder}")
    print("置換処理を開始します...")
    
    # 3. 置換処理の実行
    count = replace_bold_in_md(target_folder)
    
    # 4. 終了メッセージ
    messagebox.showinfo("完了", f"処理が終了しました。\n変更されたファイル数: {count}")
    print(f"すべての処理が終了しました。（変更ファイル数: {count}）")