-- 1. public_posts: 公開記事テーブル
CREATE TABLE public_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  date TEXT, -- YYYY-MM-DD 形式
  description TEXT,
  category TEXT,
  thumbnail TEXT,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. private_posts: 保護記事テーブル
CREATE TABLE private_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  date TEXT, -- YYYY-MM-DD 形式
  excerpt TEXT,
  category TEXT,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. posts_password: 保護記事のパスワード管理
CREATE TABLE posts_password (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL REFERENCES private_posts(slug) ON DELETE CASCADE,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- updated_at 自動更新用の関数とトリガー（任意）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_public_posts_updated_at BEFORE UPDATE ON public_posts FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_private_posts_updated_at BEFORE UPDATE ON private_posts FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_posts_password_updated_at BEFORE UPDATE ON posts_password FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
