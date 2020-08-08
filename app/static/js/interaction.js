// Set the dimensions and margins of the diagram
const w = window.innerWidth / 3 * 2 - 30;
const h = window.innerHeight - 100;
const margin = {top: 10, right: 20, bottom: 10, left: 20};
let width = w - margin.right - margin.left;
let height = h - margin.top - margin.bottom;

let imageID = 0;
let MAX_ZOOM_IN = 10;
let MAX_ZOOM_OUT = 0.5;
let zoom = d3.behavior.zoom().scaleExtent([MAX_ZOOM_OUT, MAX_ZOOM_IN]).on('zoom', zoomed);

let canvas = d3.select("#board")
    .attr('width', width)
    .attr('height', height)
    .append("svg")
    .attr('viewBox', '0 0 ' + width + ' ' + height)
    .attr('xmlns', 'http://www.w3.org/2000/svg')
    .attr("width", width + margin.right + margin.left)
    .attr("height", height - 112)
    .attr('id', 'canvas')
    .call(zoom);
let container = canvas.append('g')
    .attr('id', '')
    .attr('width', '100%')
    .attr('height', '100%');
canvas.append('text')
    .attr('x', width / 2 - 50)
    .attr('y', 100)
    .text('Please click a image for boarding.');

function submit() {
    let input = document.getElementById("search").value;
    addAndDrawHistory(input);
    $.ajax({
        url: "/search/" + input,
        type: "get",
        data: input,
        success: function (response) {
            let re = JSON.parse(response);
            let keywords = re['keywords'];
            let images = re['images'];
            drawKeywords(keywords);
            drawImages(images);
        },
        error: function (xhr) {
            //Do Something to handle error
        }
    });
}

function resubmit(i) {
    let input = i.innerHTML;
    $.ajax({
        url: "/search/" + input,
        type: "get",
        data: input,
        success: function (response) {
            let re = JSON.parse(response);
            let keywords = re['keywords'];
            let images = re['images'];
            drawKeywords(keywords);
            drawImages(images);
        },
        error: function (xhr) {
            //Do Something to handle error
        }
    });
}

/* Search History */
let addHistory = (function () {
    const MAXLEN = 10;
    let history = [];

    function _addHistory(value) {
        const idx = history.indexOf(value);
        // console.log(idx);
        if (idx < 0) {
            // 未找到，新插入，删掉旧的
            history = [value].concat(history.slice(0, MAXLEN - 1));
            return history;
        }
        if (idx === 0) {
            // 已找到，就是第一个，直接return
            return history;
        }

        // 已找到，在后面，挪到前面
        history = [value].concat(history.slice(0, idx), history.slice(idx + 1))
        return history;
    }

    return _addHistory;
})();

function addAndDrawHistory(value) {
    const history = addHistory(value);
    const ihtml = history
        .map(e =>
            `<span class="badge badge-info mr-1" type="button" onclick="fillInBadge(this)">${e}</span>`
        )
        .join('')
    document.getElementById("history").innerHTML = ihtml;
}

function fillInBadge(i) {
    const value = i.textContent;
    const input = document.getElementById('search');
    if (input.value === value) return;
    input.value = value;
    addAndDrawHistory(value);
    resubmit(i);
}

function drawKeywords(i) {
    // console.log(i);
    let khtml = '';
    for (let e in i) {
        khtml = khtml + '<span class="badge badge-primary" type="button" onclick="fillInBadge(this)">' + i[e] + '</span> '
    }
    document.getElementById("keywords").innerHTML = khtml;
}

function drawImages(i) {
    // console.log(i);
    let ihtml = '';
    for (let e in i) {
        ihtml = ihtml + '<img src="../static/img/' + i[e] + '" alt="..." class="img-fluid img-thumbnail" onclick="addImage(\'../static/img/' + i[e] + '\')">'
    }
    document.getElementById("images").innerHTML = ihtml;
}

function addImage(input) {
    let imageWidth = 120;
    let imagePlace = 0;
    // remove text
    canvas.select('text').remove();
    // remove the whole content
    container.select('g').remove();
    imageID += 1;

    let imageName = input.split('/')[3];

    let group = container.append("g")
        .attr("transform", "translate("
            + margin.left + "," + margin.top + ")")
        .attr('id', 'image_' + imageID)
        .classed('draggable', true);
    group.append("image")
        .attr('href', input)
        .attr('width', imageWidth)
        .attr('x', imagePlace)
        .attr('y', (height - 112) / 2 - imageWidth / 2)
        .attr('onmouseup', 'browseImage("' + input + ',' + imageID + '")')
        .attr("id", "boarding_" + imageID);
    let buttons = group.append("foreignObject")
        .attr('x', imagePlace + imageWidth - 61)
        .attr('y', (height - 112) / 2 - imageWidth / 2)
        .attr('width', imageWidth - 40)
        .attr('height', 30)
        .append('xhtml:div')
        .attr('xmlns', 'http://www.w3.org/1999/xhtml')
        .attr('style', 'display: none;')
        .attr('id', 'button_' + imageID);
    buttons.append('button')
        .attr('class', 'btn btn-danger btn-sm hide')
        .attr('type', 'button')
        .attr('id', 'remove_' + imageID)
        .attr('onclick', 'remove(' + imageID + ')')
        .append('i')
        .attr('class', 'fas fa-trash-alt');
    let keywords = group.append("foreignObject")
        .attr('x', imagePlace)
        .attr('y', (height - 112) / 2 - imageWidth / 2 - 40)
        .attr('width', imageWidth)
        .attr('height', 40)
        .append('xhtml:div')
        .attr('xmlns', 'http://www.w3.org/1999/xhtml')
        .attr('style', 'display: none;')
        .attr('id', 'keywords_' + imageID);

    $.ajax({
        type: "POST",
        url: "/plot/" + imageName,
        data: imageName,
        success: function (response) {
            let re = JSON.parse(response);
            let kw = re['keywords'];
            for (let w in kw) {
                keywords.append('span')
                    .attr('class', 'badge badge-warning mr-1 hide')
                    .attr('type', 'button')
                    .attr('onclick', 'inquire("' + imageName + ',' + kw[w] + ',' + imageID + '")')
                    .html(kw[w]);
            }
        },
        error: function (xhr) {
            //Do Something to handle error
        }
    });
}

//Function called on the zoom event. It translate the draw on the zoommed point and scale with a certain factor
function zoomed() {
    container.attr("transform", "translate(" + (d3.event.translate[0]) + "," + (d3.event.translate[1]) + ")scale(" + d3.event.scale + ")");
}

// click on the image
function browseImage(input) {
    let res = input.split(',');
    let image_url = res[0];
    let image_name = res[0].split('/');
    let image_id = res[1];

    let popup_kw = document.getElementById('keywords_' + image_id);
    if (popup_kw.style.display === "none") {
        popup_kw.style.display = "block";
    } else {
        popup_kw.style.display = "none";
    }

    let popup = document.getElementById('button_' + image_id);
    if (popup.style.display === "none") {
        popup.style.display = "block";
    } else {
        popup.style.display = "none";
    }
}

function clearboard() {
    // console.log('clear');
    container.selectAll('*').remove();
}

function screenshot() {
    console.log('screenshot');
}

function printout() {
    console.log('print out');
}

function shareto() {
    console.log('share to');
}

function refresh(i) {
    console.log(i);
}

function addSubImage(x, y, i, input) {
    console.log(input);
    let imageWidth = 240, imageHeight = 120;
    let group = container.append("g")
        .attr("transform", "translate("
            + x + "," + y + ")")
        .attr('id', 'image_' + i)
        .classed('draggable', true);
    group.append('rect')
        .style('fill', 'white')
        .style('stroke', 'black')
        .style('stroke-width', 3)
        .attr('width', imageWidth)
        .attr('height', imageHeight);
    group.append("image")
        .attr('href', '../static/img/' + input['name'])
        .attr('width', input['width'] / input['height'] * imageHeight)
        .attr('height', imageHeight)
        .attr('onmouseup', 'browseImage("' + input['name'] + ',' + i + '")')
        .attr("id", "boarding_" + i);
    let buttons = group.append("foreignObject")
        .attr('x', imageWidth - 61)
        .attr('y', 0)
        .attr('width', 62)
        .attr('height', 30)
        .append('xhtml:div')
        .attr('xmlns', 'http://www.w3.org/1999/xhtml')
        .attr('style', 'display: none;')
        .attr('id', 'button_' + i);
    buttons.append('button')
        .attr('class', 'btn btn-danger btn-sm hide')
        .attr('type', 'button')
        .attr('id', 'remove_' + i)
        .attr('onclick', 'remove(' + i + ')')
        .append('i')
        .attr('class', 'fas fa-trash-alt');
    let keywords = group.append("foreignObject")
        .attr('x', 0)
        .attr('y', -40)
        .attr('width', imageWidth)
        .attr('height', 40)
        .append('xhtml:div')
        .attr('xmlns', 'http://www.w3.org/1999/xhtml')
        .attr('style', 'display: none;')
        .attr('id', 'keywords_' + i);
    for (let w in input['keywords']) {
        keywords.append('span')
            .attr('class', 'badge badge-warning mr-1 hide')
            .attr('type', 'button')
            .attr('onclick', 'inquire("' + input['name'] + ',' + input['keywords'][w] + ',' + i + '")')
            .html(input['keywords'][w]);
    }
}

function inquire(i) {
    let imgName = i.split(',')[0];
    let keyword = i.split(',')[1];
    let imgID = i.split(',')[2];
    console.log(imgName, keyword, imgID);
    let img = document.getElementById("boarding_" + imgID).getBBox();
    // let img1 = document.getElementById("boarding_" + imgID).getBoundingClientRect();
    console.log(img);
    let recHeight = 220, sec = 80, imageHeight = 120, imageWidth = 240;

    let g_id = "#image_" + imgID;
    let x1 = img.x + img.width, y1 = img.y + img.height / 2;
    let x2 = img.x + img.width + sec / 2;
    let y_semantic = y1 - recHeight / 2 - sec;
    let y_color = y1;
    let y_shape = y1 + recHeight / 2 + sec;

    // image

    $.ajax({
        url: "/inquire/" + i,
        type: "get",
        data: i,
        success: function (response) {
            let re = JSON.parse(response);
            console.log(x1, y_semantic, y_color, y_shape);
            imageID += 1;
            addSubImage(x1 + sec, y_semantic - imageHeight / 2, imageID, re['semantic'][0]);
            imageID += 1;
            addSubImage(x1 + sec, y_color - imageHeight / 2, imageID, re['color'][0]);
            imageID += 1;
            addSubImage(x1 + sec, y_shape - imageHeight / 2, imageID, re['shape'][0]);
        },
        error: function (xhr) {
            //Do Something to handle error
        }
    });

    // line
    let lineGenerator = d3.svg.line()
        .x(function (d) {
            return d.x;
        })
        .y(function (d) {
            return d.y;
        })
        .interpolate('bundle');

    console.log(x1, y_semantic, y_color, y_shape);

    let path1 = [{'x': x1, 'y': y1}, {'x': x2, 'y': y1}, {'x': x1, 'y': y_semantic}, {'x': x2, 'y': y_semantic}];
    let path2 = [{'x': x1, 'y': y1}, {'x': x2, 'y': y1}, {'x': x1, 'y': y_color}, {'x': x2, 'y': y_color}];
    let path3 = [{'x': x1, 'y': y1}, {'x': x2, 'y': y1}, {'x': x1, 'y': y_shape}, {'x': x2, 'y': y_shape}];
    let cen_x = (x1 + x2) / 2;
    let cen_1 = (y1 + y_semantic) / 2;
    let cen_2 = (y1 + y_color) / 2;
    let cen_3 = (y1 + y_shape) / 2;

    d3.select(g_id)
        .append('path')
        .attr('d', lineGenerator(path1))
        .style('fill', 'none')
        .style('stroke', '#e67e22')
        .style('stroke-width', '3')
        .on('mouseover', function () {
            d3.select('#path_s_' + imgID)
                .style('visibility', 'visible');
        })
        .on('mouseout', function () {
            d3.select('#path_s_' + imgID)
                .style('visibility', 'hidden');
        });
    d3.select(g_id)
        .append('text')
        .text('Semantic')
        .attr('transform', function () {
            return "translate(" + (cen_x - 30) + "," + (cen_1 - 11) + ")"
        })
        .attr('id', 'path_s_' + imgID)
        .style('visibility', 'hidden')
        .style('fill', '#d35400');

    d3.select(g_id)
        .append('path')
        .attr('d', lineGenerator(path2))
        .style('fill', 'none')
        .style('stroke', '#9b59b6')
        .style('stroke-width', '3')
        .on('mouseover', function () {
            d3.select('#path_c_' + imgID)
                .style('visibility', 'visible');
        })
        .on('mouseout', function () {
            d3.select('#path_c_' + imgID)
                .style('visibility', 'hidden');
        });
    d3.select(g_id)
        .append('text')
        .text('Color')
        .attr('transform', function () {
            return "translate(" + (cen_x - 15) + "," + (cen_2 - 11) + ")"
        })
        .attr('id', 'path_c_' + imgID)
        .style('visibility', 'hidden')
        .style('fill', '#8e44ad');

    d3.select(g_id)
        .append('path')
        .attr('d', lineGenerator(path3))
        .style('fill', 'none')
        .style('stroke', '#2ecc71')
        .style('stroke-width', '3')
        .on('mouseover', function (d) {
            d3.select('#path_sh_' + imgID)
                .style('visibility', 'visible');
        })
        .on('mouseout', function (d) {
            d3.select('#path_sh_' + imgID)
                .style('visibility', 'hidden');
        })
        .on('click', function (d) {
            console.log(d);
        });
    d3.select(g_id)
        .append('text')
        .text('Shape')
        .style('fill', '#27ae60')
        .attr('id', 'path_sh_' + imgID)
        .style('visibility', 'hidden')
        .attr('transform', function (d) {
            return "translate(" + (cen_x - 15) + "," + (cen_3 - 11) + ")"
        });
}

function drawTree(d) {
    console.log(d);
}

function remove(i) {
    let g_id = "#image_" + i;
    d3.select(g_id).remove();
}

