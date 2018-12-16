const https = require('https');
const fs = require('fs');
var app_id = "";
var app_key = "";
var usage = "Usage:\n./dict <def|syn|ant> <word>";
var word = "";
var word_arr = ['good','bad','simple','extraordinary']
var app_init = function(cb) {
    fs.readFile('./secret.json','ascii', (err, data) => {
        if (err) throw err;
        data = JSON.parse(data);
        app_id = data["app_id"]
        app_key = data["app_key"]
        if(process.argv.length == 2){
            word = 'good';
            cb('wod');
        }
        else if(process.argv.length == 4){
            word = process.argv[3];
            cb(process.argv[2]);
        }
        else if(process.argv.length == 3 && process.argv[2]=='play'){
            cb(process.argv[2]);
        }
        else{
            console.log('Invalid Arguments!\n' + usage);
            return;
        }
    });
}

 
  
var oxforddictionarycall = function(type,cb){
    var params = {
        host :  'od-api.oxforddictionaries.com',
        path : '/api/v1/entries/en/'+type,
        method : 'GET',
        headers : {
                "Accept": "application/json",
                "app_id": app_id,
                "app_key": app_key
                }
        };
    var wod=false;
    var cb_count=3;
    if(typeof cb=='number'){
        wod=true;
        cb_count = cb;
        cb=printerr;
    }
    https.get(params, function(res) {
        if(res.statusCode == 404){
            cb("No such entry found");
        }
        else{
            var data = "";
            res.on('data', function(chunk) {
                    data +=  chunk;
            }).on('end',function(){
                try {
                    result = JSON.parse(data);
                } 
                catch (exp) {
                    cb('JSON Parse failed');
                }
                if(wod==true){
                    if(cb_count==0){ oxforddictionarycall(word+'/synonyms',cb_count+1); definition(null, result);}
                    else if(cb_count==1){ oxforddictionarycall(word+'/antonyms',cb_count+1); synonyms(null, result);}
                    else if(cb_count==2){ antonyms(null, result);}
                }
                else cb(null,result);
            }).on('error',function(err){
                cb(err);    
            });
        }
    });
}; 

var definition = function(error, result){
    if(error) console.log(error);
    if(result) console.log('Definition: '+result['results'][0]['lexicalEntries'][0]['entries'][0]['senses'][0]['definitions'][0]);
}

var synonyms = function(error, result){
    if(error) console.log(error);
    if(result) {
        console.log('Synonyms: ');
        for(entry in result['results'][0]['lexicalEntries'][0]['entries'][0]['senses'][0]['synonyms']){
            console.log(result['results'][0]['lexicalEntries'][0]['entries'][0]['senses'][0]['synonyms'][entry]['text']);
        }
    }
}
var antonyms = function(error, result){
    if(error) console.log(error);
    if(result) {
        console.log('Antonyms: ');
        for(entry in result['results'][0]['lexicalEntries'][0]['entries'][0]['senses'][0]['antonyms']){
            console.log(result['results'][0]['lexicalEntries'][0]['entries'][0]['senses'][0]['antonyms'][entry]['text']);
        }
    }
}
var printerr = function(err){
    console.log(err);
}

var run_app = function(type){
    if('def' == type)
        oxforddictionarycall(word,definition);
    else if('syn' == type)
        oxforddictionarycall(word+'/synonyms',synonyms);
    else if('ant' == type)
        oxforddictionarycall(word+'/antonyms',antonyms);
    else if('wod' == type){
        
        oxforddictionarycall(word_arr[Math.floor((Math.random() * word_arr.length))],0);
    }
    else
        console.log('Invalid Arguments!\n'+usage);
}
app_init(run_app);