-- Trigger para garantir que cada ADR tenha pelo menos um participante "owner"
DELIMITER $$

CREATE TRIGGER trg_adr_owner_must_exist
AFTER DELETE ON ADR_Participant
FOR EACH ROW
BEGIN
  DECLARE owners INT;
  
  -- Contar quantos participantes "owner" existem para o ADR
  SELECT COUNT(*) INTO owners
  FROM ADR_Participant
  WHERE adr_id = OLD.adr_id AND role = 'OWNER';
  
  -- Se não houver nenhum owner e o registro excluído era um owner, evitar a exclusão
  IF owners = 0 AND OLD.role = 'OWNER' THEN
    SIGNAL SQLSTATE '45000' 
    SET MESSAGE_TEXT = 'Não é possível remover o último owner de um ADR. Cada ADR precisa ter pelo menos um participante com papel de owner.';
  END IF;
END$$

DELIMITER ;

-- Trigger para verificar antes de atualizar o papel de um participante
DELIMITER $$

CREATE TRIGGER trg_adr_owner_must_exist_update
BEFORE UPDATE ON ADR_Participant
FOR EACH ROW
BEGIN
  DECLARE owners INT;
  
  -- Se estiver mudando de OWNER para outro papel, verificar
  IF OLD.role = 'OWNER' AND NEW.role != 'OWNER' THEN
    -- Contar quantos outros owners existem para o ADR
    SELECT COUNT(*) INTO owners
    FROM ADR_Participant
    WHERE adr_id = NEW.adr_id AND role = 'OWNER' AND id != NEW.id;
    
    -- Se não houver outros owners, evitar a atualização
    IF owners = 0 THEN
      SIGNAL SQLSTATE '45000' 
      SET MESSAGE_TEXT = 'Não é possível mudar o papel do último owner de um ADR. Cada ADR precisa ter pelo menos um participante com papel de owner.';
    END IF;
  END IF;
END$$

DELIMITER ; 