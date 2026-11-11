-- Adds the "Contacted" status, between Open and Applied: the EP has been
-- reached out to but hasn't submitted an application yet.
alter type status_enum add value 'Contacted' after 'Open';
