var express = require('express')
var request = require('request')
var cheerio = require('cheerio')
var app = express()
var exphbs = require('express-handlebars')
var path = require('path')

var desc = ['accessible','acidic','aftertaste','aggressive','alcoholic','almondlike','apple','artificial','assertive','astringent','backbone','bacony/bacon','balance','bananalike','barnyard',
'big','biscuity/biscuit','bitter','body','bold','boozy/booze','bourbonlike/bourbon','bready/bread','Brettanomyces/brett','bright','bubblegum','burnt','buttery/butter','caramely/caramel',
'catty','chalky','cheesy/cheese','chewy','Chlorophenolic','chocolaty/chocolate','cigarlike/cigar','citrusy/citrus','clean','clovelike/clove','cloying','coconut','coffeelike/coffee','colorful',
'complex','corked','cornlike/corn','crackerlike/cracker','creamy/cream','crisp','dark','fruit','deep','delicate','Diacetyl','dirty/dirt','dissipate','doughy/dough','fruity/fruit','dry',
'earthy/earth','estery/ester','farmlike','fine','firm','flat','flowery/flower','fluffy/fluff','foamy/foam','fresh','bodied','gassy','Geraniol','grainy/grain','grapefruity/grapefruit',
'grassy/grass','greasy/grease','green','harmonious','harsh','hazy/haze','head','hearty','heavy','herbal','highlights','hollow','honeylike/honey','hoppy/hops','horselike/horse','hot','husky',
'inky/ink','intense','jammy/jam','Lactobacillus','leathery/leather','legs','lemony/lemon','light','lightstruck','linalool','medicinal','mellow','melonlike/melon','Mercaptan','metallic','mild',
'milky/milk','minerally/mineral','molasses','moldy/mold','moussy','musty/must','nutty/nuts','oaky/oak','oatmeal','oily/oil','Chlorophenol','overtones','oxidation','oxidized','papery/paper',
'peaty/peat','peppery/pepper','perfumy/perfume','persistent','phenolic','powerful','rancid','refined','refreshing','resinous','rich','roasted','robust','rocky','saccharine','salty/salt',
'sediment','sharp','sherrylike/sherry','silky/silk','skunky/skunked','smoky/smoke','smooth','soapy/soap','soft','solventlike/solvent','sour','spicy/spice','stale','sticky','sulfidic',
'sulfitic','sweet','syrupy/syrup','tannic','tannins','tart','texture','texture','thick','thin','toasty/toast','toffee','nonenal','treacle','turbid','undertones','vanilla','vegetal','viscous',
'warming','watery/water','winelike','woody/wood','worty/wort','yeasty/yeast','young','zesty/zest']
var globalcounter = 9271
var rowcount 


app.use(express.static(path.join(__dirname, '/public')))

app.use('/bsearch',express.static(path.join(__dirname, '/public')))

app.use('/beer', express.static(path.join(__dirname, '/public')))

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');


//making socket to talk to client
var http = require('http').createServer(app);
var io = require('socket.io')(http);

var PORT = process.env.PORT || 8081

var pgp = require('pg-promise')()



const pg = require('pg')  
const conString = 'postgres://gpguzsrnfsmpgo:9996edfb1e4970a620c051c55185a261cb4727398e9442f00edd3147dd0b649c@ec2-23-23-225-116.compute-1.amazonaws.com:5432/d99ibit2lngmvm' // make sure to match your own database's credentials

var db = pgp(conString)

//scraping in VT data
function usecallback(callback){
	var state = 'MI'
	var top = 260
	var brewlinks = []

	var j 
	for(j=0;j<=top;j+=20){
		url = 'https://www.beeradvocate.com/place/list/?start='+j.toString()+'&&c_id=US&s_id='+state+'&brewery=Y&sort=name'

		request(url, function(error, response, html){
			console.log(++j-(top+20))
			if(error){
				console.error(error)
			}
			else{
				var $ = cheerio.load(html)

				
				$('#ba-content').filter(function(){

					var data = $(this).children("table").children("tr")

					var i 
					for (i = 3; i<= 41; i+=2){
						if(data.eq(i).children().eq(0).children("a").eq(0).attr() == undefined){
							break;
						}
						brewlinks.push(data.eq(i).children().eq(0).children("a").eq(0).attr().href)
					}

					
				})

			}
			if(j-(top+20)==(top+20)/20){
				callback(brewlinks, donecb)
			}
			
		})
	}
	
	
}

app.use('/scrape', function(req, res){


	res.sendFile(__dirname + "/public/index.html")
	usecallback(mycb)
	
})

function getbeerdata(){
	console.log("beer data")
	urlbase = "https://www.beeradvocate.com"
	
	db.one('select count(*) from calibeers')
		.then(function(data){
			rowcount = data.count

				db.one('select beerlink,beerid from calibeers where beerid=$1', globalcounter)
					.then( function(data){
					
						beertroll(data.beerlink, data.beerid)
					})
					.catch( function(err){
						console.error("db error:",err)
					})



		})
		.catch(function(err){
			console.error("db error (count):",err)
		})
	//console.log(rowcount)

}

//gotta n do a request block, troll through the DOM, aggregate word counts
//create a new column in db and add the normalized feature array
function beertroll(link, beerid){
	url = "https://www.beeradvocate.com" + link + "?sort=topr&start="
	var darray = Array.apply(null, Array(180)).map(Number.prototype.valueOf,0)
	var $
	var data
	var i
	var text
	var endcount = 25
	function recreqwrapper(offset, count){
		request(url + offset, function(error, response, html){
			if (error){
				console.error("request error at beerlink: "+link, error)
				recreqwrapper(offset, count)
			}
			else{
				//do stuff with html, call aggwords a bunch
				//check if next page is an option and if reqcount < 3
				$ = cheerio.load(html)
				data = $('#rating_fullview')
				i = 0
				while(data.children().eq(i).children().eq(1).children().text()!== "" && i < 25){
					
					text = data.children().eq(i).children().eq(1).text()
					darray = aggwords(text, darray)
					i++
				}	

				if (count<3 && i>=24){
					//console.log(offset)
					recreqwrapper(offset+25, count+1)
				}
				else{
					//insert darray into db
					//console.log('beerid: ' + bid)
					db.none('update calibeers set desclist = $1 where beerid = $2', [normalize(darray), beerid])
						.then( function(data){
							console.log(beerid)

							if(beerid <= rowcount){
								db.one('select beerlink,beerid from calibeers where beerid=$1', beerid + 1)
									.then( function(data){
										globalcounter++
										beertroll(data.beerlink, data.beerid)
									})
									.catch( function(err){
										console.error("db error:",err)
									})
							}

						})
						.catch( function(err){
							console.error("update db error:", err)
							console.log(beerid)
							if(beerid <= rowcount){
								db.one('select beerlink,beerid from calibeers where beerid=$1', beerid + 1)
									.then( function(data){
						
										beertroll(data.beerlink, data.beerid)
									})
									.catch( function(err){
										console.error("db error:",err)
									})
							}
						})
					// console.log(normalize(darray)[15])
					// console.log(desc[15])
				}

			}
		})
	}
	return recreqwrapper(0, 0)
}

function normalize(arr){
	var sum = 0
	var len = arr.length
	for (var i = 0; i < len; i++){
		sum += arr[i] * arr[i]
	}
	sum = Math.sqrt(sum)
	for (var i = 0; i < len; i++){
		arr[i] = arr[i]/sum
	}
	return arr
}


function chkstrings(str1, str2){
	res = str2.split('/')
	if (res.length == 1){
		if (str1.toLowerCase() == str2){
			return true
		}
	}
	else if (res.length == 2){
		if (str1.toLowerCase() == res[0] || str1.toLowerCase() == res[1]){
			return true
		}
	}
	return false
}

function aggwords(text, darray){
	var words = text.split(/[ \/,\-\.\n\t]/)
	var len = words.length
	var len2 = 180
	for (var i = 0; i < len; i++){
		for (var j = 0; j < len2; j++){
			if (chkstrings(words[i], desc[j])){
				darray[j] = darray[j] + 1
			}
		}
	}
	return darray
}

app.use('/scrape2', function(req, res){
	res.sendFile(__dirname + "/public/index.html")
	getbeerdata()
})

io.on('connection', function(socket){
	console.log('connected')

})

function parseNumRatings(s){
	if (s.includes(",")){
		return parseFloat(s.replace(",",""))
	}
	return parseFloat(s)
}

function mycb(bl, callback){
	urlbase = 'https://www.beeradvocate.com'
	var j = 0
	var data
    var brewery
    var beerlink
    var state = 'Michigan'
    var $
    var i 
    var queries
    var len = bl.length
	bl.forEach( function(item){
		url = urlbase + item
		
		request(url, function(error, response, html){
			if(error){
				console.error(error)
			}
			else{
				
					
					
				db.tx(function(t){
					
					$ = cheerio.load(html)
					brewery = $('.titleBar').text().trim()
					data = $('#ba-content').find("table").children()
					queries = []
					i = 3
					while (data.eq(i).children()[0] != undefined){
						beerlink = data.eq(i).children().eq(0).children().eq(0).attr('href')
						//console.log(beerlink)
						 if (!Number.isNaN(parseFloat(data.eq(i).children().eq(3).text())) && parseNumRatings(data.eq(i).children().eq(4).text()) > 2){
							queries.push(t.none("INSERT INTO calibeers (brewery, beerlink, beername, style, abv, avgrating, numratings, brorating, state) SELECT $1, $2, $3, $4, $5, $6, $7, $8, $9 where not exists (select beername, abv, avgrating from calibeers where beername = $3 AND abv = $5 AND avgrating = $6)", 
								[brewery, beerlink, data.eq(i).children().eq(0).text(), 
								data.eq(i).children().eq(1).text(), 
								parseFloat(data.eq(i).children().eq(2).text()), 
								parseFloat(data.eq(i).children().eq(3).text()), 
								parseNumRatings(data.eq(i).children().eq(4).text()), 
								parseFloat(data.eq(i).children().eq(5).text()),
								state]))
						}
					 	i++;
					}
					return this.batch(queries)
				})
					.then(function(data){
						console.log(++j)
						//console.log(data)
						if (j==len){
							console.log(j+" was called.")
							callback()
						}
					})
					.catch(function(err){
						++j
						console.log(brewery)
						console.error("Caught this chode:", err)
					})
				
			}
			
		})
	
	})
}

function donecb(){
	console.log("done call back----------------------------------------------------------------------")
	io.emit('done scraping')

}

//code for implementing the UI portion of the app-----------------

app.get('/', function(req, res){
	//res.sendFile(__dirname + "/public/home.html")

	res.render('home', {
		beer: 'search for a beer'
	})

})

app.get('/bsearch', function(req, res){
	//console.log('beer: ' + req.query['beer'])
	//res.sendFile(__dirname + "/public/home.html")
	db.any("select * from calibeers where lower(brewery) like lower(${term}) or lower(beername) like lower(${term}) order by avgrating desc", {term: '%' + req.query['beer'] + '%'})
		.then( function (data){
			//console.log(data)
			res.render('home', {
				beers: data
			})
		})
		.catch( function (error){
			console.error('search error:', error)
			res.render('home', {
				beers: "Error fetching results from database"
			})
		})

	
})

function getTop(arr){
	var out = []
	var out2 = []
	for (var i = 0; i < 180; i++){
		if (out.length < 10){
			out[i] = arr[i]
			out2[i] = i
		}
		else{
			for (var j = 0; j < 10; j++){
				if (out[j]<arr[i]){
					out[j] = arr[i]
					out2[j] = i
					break
				}
			}
		}
	}
	var outdict = {}
	for (var i = 0; i < 10; i++){
		outdict[desc[out2[i]]] = out[i]*50 
	}
	return outdict
}

app.get('/beer/[0-9]*', function(req, res){
	console.log("here's the stuff "+ req.query['beerid'])
	db.one("select * from calibeers where beerid=$(id)", {id: req.query['beerid']})
		.then( function (data){
			db.none("create or replace view testview as select brewery, beername, beerid, style, abv, avgrating, (getSDistance(grabArray($(id)), desclist)) as distance from calibeers", {id: req.query['beerid']})
				.then( function (data2){
					db.many("select * from testview order by distance limit 5 offset 1")
						.then( function (data3){
							console.log(getTop(data.desclist))
							res.render('beer', {
								beer: data,
								simbeers: data3,
								descs: getTop(data.desclist)
							})
							//console.log(data3)
							db.none("drop view testview")
						})
						.catch( function (err){
							console.error(err)
						})
				})
				.catch( function (err){
					console.error(err)
				})
			
		})
		.catch( function (err){
			console.error(err)
		})

})


//----------------------------------------------------------------

http.listen(PORT, function(){
	console.log('Got ears on', PORT)
})


exports = module.exports = app;
