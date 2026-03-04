-- Migration pour ajouter le champ conversation_id à la table packs
-- Ce champ stocke l'ID du groupe de discussion créé dans messaging-service

ALTER TABLE packs 
ADD COLUMN IF NOT EXISTS conversation_id BIGINT;

-- Ajouter un commentaire pour documenter la colonne
COMMENT ON COLUMN packs.conversation_id IS 'ID du groupe de discussion dans messaging-service';
