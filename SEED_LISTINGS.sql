-- SkillSwap Seed Data
-- Run this in your Supabase SQL Editor (it runs as superuser and bypasses RLS)
-- Go to: supabase.com > your project > SQL Editor > New Query > paste > Run

-- NOTE: user_id is intentionally NULL for seeded demo listings.
-- To assign them to your account, replace NULL with your user UUID:
-- e.g. '00000000-0000-0000-0000-000000000000'

INSERT INTO listings (user_id, user_name, offering, wanting, category, bio) VALUES
(NULL, 'Ed McClure', 'Custom modern logo design within 48 hours', 'Looking for web dev, copywriting, or marketing help', 'Design', 'Professional designer with 8+ years experience.'),
(NULL, 'Ed McClure', 'Executive-level resume and LinkedIn optimization', 'Looking for SEO, branding, or consulting services', 'Other', 'Career coach and resume expert.'),
(NULL, 'Ed McClure', '3-page responsive website setup', 'Looking for design, content writing, or marketing', 'Tech', 'Full-stack developer, React + Supabase specialist.'),
(NULL, 'Ed McClure', 'SEO optimization — improve rankings and keyword targeting', 'Looking for web development or design work', 'Marketing', 'Digital marketer with proven SEO results.'),
(NULL, 'Ed McClure', 'Full social media setup for Instagram, LinkedIn, Twitter', 'Looking for content creation or graphic design', 'Marketing', 'Social media strategist.'),
(NULL, 'Ed McClure', 'Google and Facebook ads campaign launch', 'Looking for copywriting or landing page design', 'Marketing', 'Paid ads expert — ROI-focused campaigns.'),
(NULL, 'Ed McClure', 'Business growth strategy and scaling advice', 'Looking for tech development or automation help', 'Other', 'Serial entrepreneur, 3 exits.'),
(NULL, 'Ed McClure', 'Investor-ready pitch deck design', 'Looking for financial modeling or business strategy', 'Design', 'Pitch deck designer for seed to Series A.'),
(NULL, 'Ed McClure', 'High-converting website and ad copywriting', 'Looking for design, dev, or paid media', 'Writing', 'Direct response copywriter.'),
(NULL, 'Ed McClure', 'UX and UI wireframes for mobile and web apps', 'Looking for front-end development or branding', 'Design', 'Product designer, UX-first approach.'),
(NULL, 'Ed McClure', 'Business data analysis and reporting', 'Looking for marketing, sales, or operations support', 'Other', 'Data analyst — Excel to Python.'),
(NULL, 'Ed McClure', 'AI workflow automation setup', 'Looking for content or design help', 'Tech', 'Automation engineer, no-code and low-code.'),
(NULL, 'Ed McClure', 'Brand positioning and messaging strategy', 'Looking for web development or video production', 'Other', 'Brand strategist and storyteller.'),
(NULL, 'Ed McClure', 'Email marketing campaigns and drip sequences', 'Looking for design or development swap', 'Marketing', 'Email marketing specialist, 40%+ open rates.'),
(NULL, 'Ed McClure', 'High-conversion landing page design', 'Looking for copywriting or paid ads management', 'Design', 'Landing page designer — CRO focused.');
