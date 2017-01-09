CREATE OR REPLACE FUNCTION getSDistance(float[], float[]) RETURNS float AS $$
DECLARE
  s float := 0;
  x float;
  i int := 1;
  arr float[] := $2;
BEGIN
  FOREACH x IN ARRAY $1
  LOOP
    s := s + (x - $2[i]) * (x - $2[i]);
    i := i + 1; 
  END LOOP;
  RETURN s;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION getClosest(float[], int, int) RETURNS int[] $$
DECLARE
  res int[$3];
  dists float[$3];
  len int := $3;
  x float;
  counter int := 1;
  i int;
  currow ROW;
  mainrow ROW;
  float[] arr;
  curdist float;
BEGIN
  RAISE NOTICE 'Finding most similar...';

  FOR currow IN SELECT * FROM calibeers WHERE beerid != $2 LOOP
    IF counter <= len AND currow.desclist != NULL THEN
      dists[counter] :=  getSDistance(arr, currow.desclist);
      res[counter] := currow.beerid;
      counter := counter + 1;
    ELSIF currow.desclist != NULL THEN
      i := 0;
      curdist := getSDistance(arr, currow.desclist);
      FOREACH x IN ARRAY dists
      LOOP
        i := i + 1;
        IF curdist < x THEN
          dists[i] := curdist;
          res[i] := currow.beerid;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  RETURN res;
END;
$$ LANGUAGE plpgsql;
 

select getSDistance(ARRAY[1,2.3,4], ARRAY[3,3.5,7])

DELETE FROM calibeers
LEFT OUTER JOIN (
   SELECT MIN(beerid) as beerid, brewery, beername, style, abv, avgrating, numratings, brorating, beerlink, desclist  
   FROM calibeers 
   GROUP BY brewery, beername
) as KeepRows ON
   calibeers.beerid = KeepRows.beerid
WHERE
   KeepRows.beerid IS NULL

   DELETE FROM calibeers WHERE beerid NOT IN (SELECT MIN(beerid) FROM calibeers GROUP BY brewery, beername);

create or replace view testview as select beername, beerid, (getSDistance(grabArray(200), desclist)) as distance from calibeers

delete from calibeers 
  where exists (select 1
    from calibeers t2
    where t2.beername = calibeers.beername AND
    t2.abv = calibeers.abv AND
    t2.avgrating = calibeers.avgrating AND
    t2.numratings = calibeers.numratings AND
    t2.beerid <> calibeers.beerid)