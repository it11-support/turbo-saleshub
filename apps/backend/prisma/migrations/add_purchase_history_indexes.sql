-- Index komposit untuk endpoint customers/{id}/purchases.
-- Tanpa index ini, agregasi COUNT pada DocDate memindai
-- seluruh baris sales_invoices / orders untuk satu CardCode.

ALTER TABLE `sales_invoices`
  ADD INDEX `sales_invoices_card_code_doc_date_index` (`CardCode`, `DocDate`),
  ADD INDEX `sales_invoices_card_code_doc_num_index` (`CardCode`, `DocNum`);

ALTER TABLE `orders`
  ADD INDEX `orders_card_code_doc_date_index` (`CardCode`, `DocDate`),
  ADD INDEX `orders_card_code_doc_num_index` (`CardCode`, `DocNum`);
