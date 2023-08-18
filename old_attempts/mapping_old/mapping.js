// TO MAKE THE MAP APPEAR YOU MUST
	// ADD YOUR ACCESS TOKEN FROM
	// https://account.mapbox.com
	mapboxgl.accessToken = '';
    // This GeoJSON contains features that include an "icon"
    // property. The value of the "icon" property corresponds
    // to an image in the Mapbox Light style's sprite.
    

    const places = 
    { "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.4036692,
          37.7897159
        ]
      },
      "properties": {
        "icon": "Coffee"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.2699044,
          37.8803291
        ]
      },
      "properties": {
        "icon": "Coffee"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.2684613,
          37.8751742
        ]
      },
      "properties": {
        "icon": "Coffee"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.2731313,
          37.8707081
        ]
      },
      "properties": {
        "icon": "Coffee"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.4324954,
          37.7994913
        ]
      },
      "properties": {
        "icon": "Coffee"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.2869747,
          37.8684254
        ]
      },
      "properties": {
        "icon": "Coffee"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.274949,
          37.7944421
        ]
      },
      "properties": {
        "icon": "Coffee"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.260848,
          37.8725738
        ]
      },
      "properties": {
        "icon": "Coffee"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.3904454,
          37.7707737
        ]
      },
      "properties": {
        "icon": "Coffee"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.2913078,
          37.8271784
        ]
      },
      "properties": {
        "icon": "Coffee"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.4318742,
          37.8053185
        ]
      },
      "properties": {
        "icon": "Coffee"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.4369858,
          37.7716287
        ]
      },
      "properties": {
        "icon": "Coffee"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.2525058,
          37.8502346
        ]
      },
      "properties": {
        "icon": "Coffee"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.2934444,
          37.8745139
        ]
      },
      "properties": {
        "icon": "Coffee"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.2973398,
          37.8625176
        ]
      },
      "properties": {
        "icon": "Coffee"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.4242302,
          37.7763869
        ]
      },
      "properties": {
        "icon": "Coffee"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.4102936,
          37.7947575
        ]
      },
      "properties": {
        "icon": "Coffee"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.4084386,
          37.77704
        ]
      },
      "properties": {
        "icon": "Coffee"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.0053844,
          37.332773
        ]
      },
      "properties": {
        "icon": "Coffee"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.2520176,
          37.8453451
        ]
      },
      "properties": {
        "icon": "Coffee"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.431413,
          37.8065274
        ]
      },
      "properties": {
        "icon": "Coffee"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.4080931,
          37.8006907
        ]
      },
      "properties": {
        "icon": "Coffee"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.2599729,
          37.8666359
        ]
      },
      "properties": {
        "icon": "Coffee"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.2663677,
          37.8126899
        ]
      },
      "properties": {
        "icon": "Coffee"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.2650524,
          37.8144754
        ]
      },
      "properties": {
        "icon": "Coffee"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.4290973,
          37.7671579
        ]
      },
      "properties": {
        "icon": "Coffee"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.4378944,
          37.7764861
        ]
      },
      "properties": {
        "icon": "Coffee"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -121.8870153,
          37.3311664
        ]
      },
      "properties": {
        "icon": "Coffee"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.3977372,
          37.7626205
        ]
      },
      "properties": {
        "icon": "Coffee"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.435521,
          37.732274
        ]
      },
      "properties": {
        "icon": "Coffee"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.412957,
          37.7724648
        ]
      },
      "properties": {
        "icon": "Coffee"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.5042112,
          37.7799292
        ]
      },
      "properties": {
        "icon": "Coffee"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.5052277,
          37.7414594
        ]
      },
      "properties": {
        "icon": "Coffee"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.4534997,
          37.7696699
        ]
      },
      "properties": {
        "icon": "Coffee"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.487926,
          37.782127
        ]
      },
      "properties": {
        "icon": "Coffee"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.4219573,
          37.767021
        ]
      },
      "properties": {
        "icon": "Coffee"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.2905905,
          37.8142768
        ]
      },
      "properties": {
        "icon": "Coffee"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.248852,
          37.8049375
        ]
      },
      "properties": {
        "icon": "Coffee"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.2618377,
          37.8360141
        ]
      },
      "properties": {
        "icon": "Coffee"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.2605424,
          37.8757834
        ]
      },
      "properties": {
        "icon": "Coffee"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.3899633,
          37.7575756
        ]
      },
      "properties": {
        "icon": "Coffee"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.2959295,
          37.89058
        ]
      },
      "properties": {
        "icon": "Coffee"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.2765429,
          37.77462
        ]
      },
      "properties": {
        "icon": "Coffee"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.42,
          37.7616667
        ]
      },
      "properties": {
        "icon": "Coffee"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.4292293,
          37.7485047
        ]
      },
      "properties": {
        "icon": "Coffee"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.3913901,
          37.7708621
        ]
      },
      "properties": {
        "icon": "Coffee"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.4093067,
          37.7754393
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.4333556,
          37.7644861
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.2661179,
          37.8695038
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.2668487,
          37.8687287
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.2586825,
          37.86562130000001
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.4090335,
          37.8003901
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.4021162,
          37.7883917
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.2632324,
          37.8349698
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.268584,
          37.8785598
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.2526819,
          37.8510297
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.2379643,
          37.7849477
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.4188995,
          37.7829132
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.2534871,
          37.8571053
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.4083431,
          37.7997075
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.2526696,
          37.8514832
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.4119778,
          37.8013826
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.267249,
          37.866206
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.6522457,
          45.5483431
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.3916911,
          37.7735205
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.283111,
          37.560525
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.2690371,
          37.879593
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.4126183,
          37.7771586
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.2601754,
          37.8757904
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.2166126,
          37.799552
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.2528287,
          37.8583833
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.438384,
          37.8006688
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.2980248,
          37.8614004
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.3936458,
          37.7957389
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.3879197,
          37.7572128
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.4408515,
          37.7878941
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.4387208,
          37.7781721
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.4639095,
          37.7640331
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.2921893,
          37.8686448
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.4743735,
          37.7826278
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.4636784,
          37.7773724
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.4332076,
          37.7834015
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.2668096,
          37.8103351
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.2579599,
          37.8680712
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.2545103,
          37.8090835
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.3876826,
          37.7687395
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.4768969,
          37.7280283
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.4211769,
          37.7918782
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.2690485,
          37.8806714
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.466442,
          37.7634047
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.2671991,
          37.8648104
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.2440731,
          37.8585403
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.2601326,
          37.8756801
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.4305494,
          37.785076
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.4305392,
          37.7850952
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.38801,
          37.7573474
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.4808069,
          37.7635704
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.2691186,
          37.8719079
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.4179873,
          37.7505546
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.3933208,
          37.7955703
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.3913901,
          37.7708621
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.3966387,
          37.7985824
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.3953713,
          37.7971425
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.4738228,
          37.7808009
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.4082666,
          37.7997326
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.3897345,
          37.7541896
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.4105757,
          37.809932
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.405143,
          37.805984
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.4218344,
          37.7663153
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.2785885,
          37.8915426
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -115.1338836,
          36.1669661
        ]
      },
      "properties": {
        "icon": "Coffee"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -115.0612373,
          36.1922194
        ]
      },
      "properties": {
        "icon": "Coffee"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -115.1528674,
          36.1575051
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -115.132962,
          36.1657782
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -115.1692281,
          36.1215874
        ]
      },
      "properties": {
        "icon": "Desert Kiosk"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -115.1717955,
          36.1173845
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -115.1539448,
          36.1578972
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -115.1702691,
          36.1099868
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -115.1199876,
          36.0109897
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -83.9526952,
          35.9557377
        ]
      },
      "properties": {
        "icon": "Coffee"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -83.9187589,
          35.9657154
        ]
      },
      "properties": {
        "icon": "Coffee"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -83.9190402,
          35.96353800000001
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -83.9189009,
          35.9649171
        ]
      },
      "properties": {
        "icon": "Coffee"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -83.9250891,
          35.9778003
        ]
      },
      "properties": {
        "icon": "Coffee"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -83.9178033,
          35.9646709
        ]
      },
      "properties": {
        "icon": "Tea and Spices"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -83.9344115,
          35.9854173
        ]
      },
      "properties": {
        "icon": "Bakery"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -83.9800181,
          36.0615371
        ]
      },
      "properties": {
        "icon": "Coffee"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -83.9397853,
          35.9509102
        ]
      },
      "properties": {
        "icon": "Coffee"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -83.9184277,
          35.9700788
        ]
      },
      "properties": {
        "icon": "Coffee"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -84.0498243,
          35.9229527
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -84.08682809999999,
          35.9130971
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -83.91928209999999,
          35.9651887
        ]
      },
      "properties": {
        "icon": "Pizza"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.6762403,
          45.6271099
        ]
      },
      "properties": {
        "icon": "Coffee"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.672555,
          45.6278365
        ]
      },
      "properties": {
        "icon": "Coffee"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.619976,
          45.4899881
        ]
      },
      "properties": {
        "icon": "Coffee"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.6711534,
          45.6343802
        ]
      },
      "properties": {
        "icon": "Coffee"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.6823427,
          45.5190805
        ]
      },
      "properties": {
        "icon": "Coffee"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.64403,
          45.5591718
        ]
      },
      "properties": {
        "icon": "Restaurant"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          77.6405456,
          12.979208
        ]
      },
      "properties": {
        "icon": "Resto-Bar"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          77.607354,
          12.973678
        ]
      },
      "properties": {
        "icon": "Resto-Bar"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          77.5951549,
          12.9779291
        ]
      },
      "properties": {
        "icon": "Park"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          77.5966959,
          12.9837428
        ]
      },
      "properties": {
        "icon": "Resto-Bar"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          77.6018504,
          12.9753638
        ]
      },
      "properties": {
        "icon": "Ice cream bar"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -122.6094101,
          45.5405153
        ]
      },
      "properties": {
        "icon": "Street Food"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          77.55571460000002,
          13.0117289
        ]
      },
      "properties": {
        "icon": "Lakeview"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          77.55533609999999,
          13.0113262
        ]
      },
      "properties": {
        "icon": "Dining"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          77.597437,
          12.9698289
        ]
      },
      "properties": {
        "icon": "Bakery"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          77.59756589999999,
          12.9706853
        ]
      },
      "properties": {
        "icon": "Dining"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          77.600661,
          12.970785
        ]
      },
      "properties": {
        "icon": "Dining"
      }
    }
  ]
}
    ;

    const layerIDs = []; // This array will contain a list used to filter against.
    const filterInput = document.getElementById('filter-input');
    const map = new mapboxgl.Map({
        container: 'map',
        // Choose from Mapbox's core styles, or make your own style with Mapbox Studio
        style: 'mapbox://styles/mapbox/light-v11',
        center: [-122.4036692, 37.7897159],
        zoom: 11.15
    });

    map.on('load', () => {
        // Add a GeoJSON source containing place coordinates and information.
        map.addSource('places', {
            'type': 'geojson',
            'data': places
        });
        for (const feature of places.features) {
            const symbol = feature.properties.icon;
            const layerID = symbol;

            // Add a layer for this symbol type if it hasn't been added already.
            if (!map.getLayer(layerID)) {
                map.addLayer({
                    'id': layerID,
                    'type': 'symbol',
                    'source': 'places',
                    'layout': {
                        // These icons are a part of the Mapbox Light style.
                        // To view all images available in a Mapbox style, open
                        // the style in Mapbox Studio and click the "Images" tab.
                        // To add a new image to the style at runtime see
                        // https://docs.mapbox.com/mapbox-gl-js/example/add-image/
                        'icon-image': 'dot-9',
                        'icon-allow-overlap': true,
                        'text-field': symbol,
                        'text-font': [
                            'Open Sans Bold',
                            'Arial Unicode MS Bold'
                        ],
                        'text-size': 11,
                        'text-transform': 'uppercase',
                        'text-letter-spacing': 0.05,
                        'text-offset': [0, 1.5]
                    },
                    'paint': {
                        'text-color': '#202',
                        'text-halo-color': '#fff',
                        'text-halo-width': 2
                    },
                    'filter': ['==', 'icon', symbol]
                });

                layerIDs.push(layerID);
            }
        }

        filterInput.addEventListener('keyup', (e) => {
            // If the input value matches a layerID set
            // it's visibility to 'visible' or else hide it.
            const value = e.target.value.trim().toLowerCase();
            for (const layerID of layerIDs) {
              
                map.setLayoutProperty(
                    layerID,
                    'visibility',
                    layerID.toLowerCase().includes(value) ? 'visible' : 'none'
                );
            }
        });

        
       
    });