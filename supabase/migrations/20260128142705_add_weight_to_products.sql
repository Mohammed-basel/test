/*
  # Add weight field to products

  1. Modified Tables
    - `products` table
      - Added `weight` column (text) to store product weight/size
      - This will display under the product name
*/

ALTER TABLE products ADD COLUMN IF NOT EXISTS weight text;
