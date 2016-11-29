var express = require('express')
var request = require('request')
var cheerio = require('cheerio')
var app = express()

var PORT = process.env.PORT || 8081;

var brewlinks = []

function usecallback(callback){
	url = 'https://www.beeradvocate.com/place/list/?c_id=US&s_id=CA&brewery=Y'
	
	
	request(url, function(error, response, html){

		if(error){
			console.error(error)
		}
		else{
			var $ = cheerio.load(html)

			
			$('#ba-content').filter(function(){

				var data = $(this).children("table").children("tr")//.eq(3).children().eq(0).children("a").eq(0).attr().href

				var i 
				for (i = 3; i<= 41; i+=2){
					brewlinks.push(data.eq(i).children().eq(0).children("a").eq(0).attr().href)
				}

				
			})

		}
	})

	var j 
	for(j=20;j<=720;j+=20){
		url = 'https://www.beeradvocate.com/place/list/?start='+j.toString()+'&&c_id=US&s_id=CA&brewery=Y&sort=name'
		//console.log(url)

		request(url, function(error, response, html){
			console.log(++j-740)
			if(error){
				console.error(error)
			}
			else{
				var $ = cheerio.load(html)

				
				$('#ba-content').filter(function(){

					var data = $(this).children("table").children("tr")//.eq(3).children().eq(0).children("a").eq(0).attr().href

					var i 
					for (i = 3; i<= 41; i+=2){
						if(data.eq(i).children().eq(0).children("a").eq(0).attr() == undefined){
							break;
						}
						brewlinks.push(data.eq(i).children().eq(0).children("a").eq(0).attr().href)
					}

					
				})

			}
			if(j-740==36){
				callback(brewlinks)
			}
			
		})
	}
	
	
}

app.use('/scrape', function(req, res){


	res.send("Scraping Data")
	usecallback(mycb)
	
})

function mycb(bl){
	urlbase = 'https://www.beeradvocate.com'
	console.log('wilder' + 'dfjkd')
	var k = 0
	bl.forEach( function(item){
			url = urlbase + item
			//console.log(url)
			request(url, function(error, response, html){
				
				if(error){
					console.error(error)
				}
				else{
					var $ = cheerio.load(html)
					var brewery

					$('.titleBar').filter(function(){
						brewery = $(this).text().trim()
					})
					console.log(++k)
					$('#ba-content').filter(function(){

						var data = $(this).find("table").children()//.eq(3).children().eq(0).children("a").eq(0).attr().href
						//console.log(data.eq(5000).children()[0])
						var i = 3
						while (data.eq(i).children()[0] != undefined){
						 	//brewlinks.push(data.eq(i).children().eq(0).children("a").eq(0).attr().href)
						 	// console.log('brewery: '+brewery+', name: ' + data.eq(i).children().eq(0).text() 
						 	// 	+', style: ' + data.eq(i).children().eq(1).text() 
						 	// 	+', ABV: ' + data.eq(i).children().eq(2).text() 
						 	// 	+', Avg: ' + data.eq(i).children().eq(3).text()
						 	// 	+', Ratings: ' + data.eq(i).children().eq(4).text()
						 	// 	+', Bros: ' + data.eq(i).children().eq(5).text())

						 	i++;
						}

						
					})

				}
			})
	

	})
}

app.listen(PORT)

console.log('Got ears on', PORT)

exports = module.exports = app;