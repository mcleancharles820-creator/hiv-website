UPDATE testing_facilities
SET address = '9XXJ+WXX, JP Laurel St, Odiongan, Romblon',
    latitude = 12.399980,
    longitude = 121.981360,
    maps_url = 'https://www.google.com/maps/search/?api=1&query=9XXJ%2BWXX%2C+JP+Laurel+St%2C+Odiongan%2C+Romblon'
WHERE facility_type = 'Rural Health Unit'
  AND city = 'Odiongan'
  AND province = 'Romblon';
