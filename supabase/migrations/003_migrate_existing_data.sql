-- Migration script to create default project and associate existing book_sections
-- This script creates a "Sandwich Project" ONLY for a specific user
-- IMPORTANT: Replace 'ahh201190@gmail.com' with your actual email address if needed

DO $$
DECLARE
  target_user_id UUID;
  default_project_id UUID;
  sections_count INTEGER;
BEGIN
  -- Find the user ID for the specified email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = 'ahh201190@gmail.com';

  -- Check if user was found
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email ahh201190@gmail.com not found. Please check the email address.';
  END IF;

  -- Check if user already has book_sections without a project_id
  IF NOT EXISTS (
    SELECT 1 FROM book_sections 
    WHERE user_id = target_user_id 
    AND project_id IS NULL
  ) THEN
    RAISE NOTICE 'No book_sections found for user % that need migration', target_user_id;
    RETURN;
  END IF;

  -- Create the default project for this specific user
  INSERT INTO projects (user_id, title, description)
  VALUES (
    target_user_id,
    'Sandwich Project',
    'The History of Sandwiches book'
  )
  RETURNING id INTO default_project_id;

  -- Update all book_sections for this user to use the new project
  UPDATE book_sections
  SET project_id = default_project_id
  WHERE user_id = target_user_id
    AND project_id IS NULL;

  -- Get count of updated sections
  GET DIAGNOSTICS sections_count = ROW_COUNT;

  RAISE NOTICE 'Created default project % (Sandwich Project) for user % and associated % book_sections', 
    default_project_id, target_user_id, sections_count;
END $$;
