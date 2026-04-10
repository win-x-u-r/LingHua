-- Add category column to vocab table
ALTER TABLE vocab ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';

-- Update existing words with categories
UPDATE vocab SET category = 'greetings' WHERE hanzi IN ('你好', '谢谢', '对不起', '再见');
UPDATE vocab SET category = 'basics' WHERE hanzi IN ('是', '不是');
UPDATE vocab SET category = 'school' WHERE hanzi IN ('朋友', '学习', '老师', '学生');
UPDATE vocab SET category = 'concepts' WHERE hanzi IN ('重要', '成功', '机会', '文化');

-- Insert expanded vocabulary (40+ new words across 6 categories)

-- GREETINGS (beginner)
INSERT INTO vocab (hanzi, pinyin, arabic_translation, level, category) VALUES
('早上好', 'zǎo shàng hǎo', 'صباح الخير', 'beginner', 'greetings'),
('晚上好', 'wǎn shàng hǎo', 'مساء الخير', 'beginner', 'greetings'),
('请', 'qǐng', 'من فضلك', 'beginner', 'greetings'),
('没关系', 'méi guān xi', 'لا بأس', 'beginner', 'greetings'),
('欢迎', 'huān yíng', 'أهلا وسهلا', 'beginner', 'greetings');

-- FAMILY (beginner)
INSERT INTO vocab (hanzi, pinyin, arabic_translation, level, category) VALUES
('爸爸', 'bà ba', 'أب', 'beginner', 'family'),
('妈妈', 'mā ma', 'أم', 'beginner', 'family'),
('哥哥', 'gē ge', 'أخ أكبر', 'beginner', 'family'),
('姐姐', 'jiě jie', 'أخت أكبر', 'beginner', 'family'),
('弟弟', 'dì di', 'أخ أصغر', 'beginner', 'family'),
('妹妹', 'mèi mei', 'أخت أصغر', 'beginner', 'family'),
('家人', 'jiā rén', 'عائلة', 'beginner', 'family');

-- NUMBERS (beginner)
INSERT INTO vocab (hanzi, pinyin, arabic_translation, level, category) VALUES
('一', 'yī', 'واحد', 'beginner', 'numbers'),
('二', 'èr', 'اثنان', 'beginner', 'numbers'),
('三', 'sān', 'ثلاثة', 'beginner', 'numbers'),
('四', 'sì', 'أربعة', 'beginner', 'numbers'),
('五', 'wǔ', 'خمسة', 'beginner', 'numbers'),
('六', 'liù', 'ستة', 'beginner', 'numbers'),
('七', 'qī', 'سبعة', 'beginner', 'numbers'),
('八', 'bā', 'ثمانية', 'beginner', 'numbers'),
('九', 'jiǔ', 'تسعة', 'beginner', 'numbers'),
('十', 'shí', 'عشرة', 'beginner', 'numbers');

-- SCHOOL (intermediate)
INSERT INTO vocab (hanzi, pinyin, arabic_translation, level, category) VALUES
('学校', 'xué xiào', 'مدرسة', 'intermediate', 'school'),
('书', 'shū', 'كتاب', 'intermediate', 'school'),
('笔', 'bǐ', 'قلم', 'intermediate', 'school'),
('电脑', 'diàn nǎo', 'حاسوب', 'intermediate', 'school'),
('同学', 'tóng xué', 'زميل', 'intermediate', 'school'),
('考试', 'kǎo shì', 'امتحان', 'intermediate', 'school'),
('作业', 'zuò yè', 'واجب', 'intermediate', 'school');

-- FOOD & DRINK (intermediate)
INSERT INTO vocab (hanzi, pinyin, arabic_translation, level, category) VALUES
('吃', 'chī', 'يأكل', 'intermediate', 'food'),
('喝', 'hē', 'يشرب', 'intermediate', 'food'),
('水', 'shuǐ', 'ماء', 'intermediate', 'food'),
('饭', 'fàn', 'أرز / طعام', 'intermediate', 'food'),
('茶', 'chá', 'شاي', 'intermediate', 'food'),
('面条', 'miàn tiáo', 'نودلز', 'intermediate', 'food'),
('水果', 'shuǐ guǒ', 'فاكهة', 'intermediate', 'food');

-- COLORS (intermediate)
INSERT INTO vocab (hanzi, pinyin, arabic_translation, level, category) VALUES
('红色', 'hóng sè', 'أحمر', 'intermediate', 'colors'),
('蓝色', 'lán sè', 'أزرق', 'intermediate', 'colors'),
('绿色', 'lǜ sè', 'أخضر', 'intermediate', 'colors'),
('黄色', 'huáng sè', 'أصفر', 'intermediate', 'colors'),
('白色', 'bái sè', 'أبيض', 'intermediate', 'colors'),
('黑色', 'hēi sè', 'أسود', 'intermediate', 'colors');

-- DAILY LIFE (advanced)
INSERT INTO vocab (hanzi, pinyin, arabic_translation, level, category) VALUES
('今天', 'jīn tiān', 'اليوم', 'advanced', 'daily'),
('明天', 'míng tiān', 'غداً', 'advanced', 'daily'),
('昨天', 'zuó tiān', 'أمس', 'advanced', 'daily'),
('时间', 'shí jiān', 'وقت', 'advanced', 'daily'),
('工作', 'gōng zuò', 'عمل', 'advanced', 'daily'),
('喜欢', 'xǐ huān', 'يحب', 'advanced', 'daily'),
('快乐', 'kuài lè', 'سعيد', 'advanced', 'daily'),
('美丽', 'měi lì', 'جميل', 'advanced', 'daily'),
('努力', 'nǔ lì', 'يجتهد', 'advanced', 'daily'),
('梦想', 'mèng xiǎng', 'حلم', 'advanced', 'daily');

-- Create index on category for filtering
CREATE INDEX IF NOT EXISTS idx_vocab_category ON vocab(category);
