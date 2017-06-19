var center,
    map,
    searchBox,
    service,
    bounds,
    markers = [],
    infowindows = [];

document.addEventListener("deviceready", function() {
    console.log('device is ready')
}, false);
document.addEventListener("backbutton", function(e) {
    e.preventDefault()
}, false);

function initMap() {

    center = {
            lat: 24.9,
            lng: 121.5
        }
        //new map
    map = new google.maps.Map(document.getElementById('map'), {
            zoom: 10,
            center: center,
            disableDefaultUI: true
        })
        //new search box
    searchBox = new google.maps.places.SearchBox(document.getElementById('mapInput'))
    service = new google.maps.places.PlacesService(map)

    map.addListener('bounds_changed', function() {
        searchBox.setBounds(map.getBounds())
    })
    searchBox.addListener('places_changed', function() {
        "use strict"
        let places = searchBox.getPlaces()
        searchConsole(places)
    })

    //activate some button
    $('.glyphicon-remove').on('click', function() {
        $('#mapInput').val('')
        _panelMove('close')
    })
    $('.glyphicon-search').on('click', function() {
        "use strict"
        let input = document.getElementById('mapInput')
        google.maps.event.trigger(input, 'focus')
        google.maps.event.trigger(input, 'keydown', { keyCode: 13 });
    })
    $('#backBtn').on('click', function() {
        _panelMove('list')
    })
}

function searchConsole(places) {
    bounds = new google.maps.LatLngBounds() // initial bounds
    $('#infoList').empty() //initial list
    removeMarker()
    if (places.length == 0) {
        return
    } else {
        _placeList(places)
    }
}

function _placeList(places) { //list multi places simple info

    places.forEach(function(place) {
        "use strict"
        let src = 'red-dot.png',
            rate = '<small>無評分</small>',
            vicinity = ''
        var openWindow = createMarker(place)

        if (place.photos)
            src = place.photos[0].getUrl({ 'maxWidth': 200, 'maxHeight': 200 })
        if (place.rating)
            rate = '<small>評分 : ' + place.rating+'</small>'
        if (place.formatted_address)
            vicinity = '<small>地址 : ' + place.formatted_address + '</small>'
        $('#infoList').append('<p class="placeTag">' + '<span class="placePic"><img src="' + src + '"></span>' + '<span class="placeName">' + place.name + '<br>' + rate + '<br>' + vicinity + '</span></p>')
            .find('.placeTag').last().on('click', function() {
                openWindow()
                _placeDetail(place)
            })
        _genBounds(place)
    })
    _panelMove('list')
}

function _placeDetail(places) { //focus one place's info    
    "use strict"
    let id = places.place_id,
        photos = [],
        open = ['無營業時間'],
        name,
        rating,
        phone,
        vicinity,
        website
    service.getDetails({ placeId: id }, function(result) {
        _panelMove('detail')
        map.panTo(result.geometry.location)
        map.setZoom(15)
        if (result.photos) {
            $.map(result.photos, function(photo) {
                photos.push(photo.getUrl({ 'maxWidth': 500, 'maxHeight': 500 }))
            })
        } else {
            photos.push('red-dot.png')
        }

        if (result.opening_hours)
            open = _openingHour(result.opening_hours);

        (result.rating) ?
        rating = '<strong>評分 : ' + result.rating + '</strong><br>': rating = '';
        (result.formatted_phone_number) ?
        phone = '<span>電話 : ' + result.formatted_phone_number + '</span><br>': phone = '';
        (result.vicinity) ?
        vicinity = '<span>地址 : ' + result.vicinity + '</span><br>': vicinity = '';
        (result.website) ?
        website = '<a href="' + result.website + '">網頁</a><br>': website = '';
        name = result.name
        $('#infoDetail').append('<p class="placeTag">' + '<span class="placePic"><img src="' + photos[0] + '"></span>' + '<span class="placeName">' + name + '</span></p>' + '<div class="detail"></div>')
        $.map(open, function(data) {
            $('.detail').append('<p>' + data + '</p>')
        })

        $('.detail').append('<p>' +
            rating +
            vicinity +
            phone +
            website +
            '</p>')
        $('.detail').find('a').click(function(e) {
            e.preventDefault()
            let href = $(this).attr('href')
            window.open(href, '_blank')
        })
        $.map(photos, function(photo) {
            $('.detail').append('<p class="detail_img"><img src="' + photo + '"></p>')
        })
    })
}

function _panelMove(step) { //control panel
    var panel = $('#infoPanel')
    switch (step) {
        case 'list':
            //...
            map.fitBounds(bounds)
            $('#backBtn').css('display', 'none')
            panel.find('#infoList').css('display', 'block')
            panel.find('#infoDetail').css('display', 'none')
            panel.animate({ left: '0' })
            break;

        case 'detail':
            //...
            $('#backBtn').css('display', 'block')
            panel.find('#infoList').css('display', 'none')
            panel.find('#infoDetail').empty().css('display', 'block')
            panel.animate({ left: '0' })
            break;

        case 'close':
            //...
            panel.animate({ left: '-420px' })
            break;
    }
}

function createMarker(place) {
    "use strict"
    let mark = new google.maps.Marker({
            map: map,
            position: place.geometry.location,
            optimized: false,
            icon: 'red-dot.png'
        }),
        infowindow = new google.maps.InfoWindow()
    infowindow.setContent(place.name)
    infowindows.push(infowindow)
    mark.addListener('mouseover', function() {
        openWindow()
    })
    mark.addListener('click', function() {
        _placeDetail(place)
    })
    markers.push(mark)
    var openWindow = () => {
        $.map(infowindows, function(info) {
            info.close()
        })
        infowindow.open(map, mark)
    }
    return openWindow
}

function removeMarker() {
    $.map(markers, function(mark) {
        mark.setMap(null)
    })
    markers = []
}

function _genBounds(place) {
    if (place.geometry.viewport)
        bounds.union(place.geometry.viewport)
    else
        bounds.extend(place.geometry.location)
}

function _openingHour(opening_hours) {
    "use strict"
    let openInfo = [],
        dayChar = function(day) {
            let days = [0, 1, 2, 3, 4, 5, 6],
                char = ['日', '一', '二', '三', '四', '五', '六']
            for (let i = 0; i < days.length; i++) {
                if (day == days[i])
                    return char[i]
            }
        };
    (opening_hours.open_now) ? openInfo[0] = '營業中': openInfo[0] = '休息中';
    openInfo[1] = ''
    let exday
    if (opening_hours.periods[0].close) {
        for (let i = 0; i < opening_hours.periods.length; i++) {
            let day = opening_hours.periods[i].open.day,
                time = opening_hours.periods[i].open.time,
                close;
            (opening_hours.periods[i].close) ? close = opening_hours.periods[i].close.time: close = '';
            time = time.substring(0, 2) + ":" + time.substring(2, 4)
            close = close.substring(0, 2) + ":" + close.substring(2, 4)
            if (day == exday) {
                openInfo[1] += ('/' + time + '~' + close)
            } else
                openInfo[1] += ('<br>' + dayChar(day) + ':' + time + '~' + close)

            exday = day
        }
    } else {
        openInfo[0] = '全年無休'
    }

    return openInfo;
}
