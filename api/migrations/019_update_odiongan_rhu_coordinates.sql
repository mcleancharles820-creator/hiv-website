UPDATE testing_facilities
SET latitude = 12.399906,
    longitude = 121.982498,
    maps_url = 'https://www.google.com/maps/search/?api=1&query=12.399906%2C121.982498'
WHERE facility_type = 'Rural Health Unit'
  AND city = 'Odiongan'
  AND province = 'Romblon';
