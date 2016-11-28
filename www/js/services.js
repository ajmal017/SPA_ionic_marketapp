angular.module('newApp.services', [])

.factory('encodeURIService', function() {
  return {
    encode: function(string){
      return encodeURIComponent(string).replace(/\"/g, "%22").replace(/\ /g, "%20").replace(/[!'()]/g, escape);
    }
  }
})

.factory('dateService', function($filter){

  var currentDate = function() {
    var d = new Date();
    var date = $filter('date')(d, 'yyyy-MM-dd');
    return date;
  }

  var oneYearAgoDate = function(){
    var y = new Date().setDate(new Date().getDate() - 365);
    var d = new Date(y);
    var date = $filter('date')(d, 'yyyy-MM-dd');
    return date;
  }

  return {
    currentDate: currentDate,
    oneYearAgoDate: oneYearAgoDate
  }
})

.factory('stockDataService', function($q, $http, encodeURIService){
/*Non-pricing ticker */
var getDetailsData = function(ticker) {
  //http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.quotes%20where%20symbol%20IN%20(%22YHOO%22)&format=json&env=http://datatables.org/alltables.env
  var deferred = $q.defer();
  /*The below query is used for YQL only*/
  query = 'select * from yahoo.finance.quotes where symbol IN ("' + ticker + '")',
  url = 'http://query.yahooapis.com/v1/public/yql?q=' + encodeURIService.encode(query) + '&format=json&env=http://datatables.org/alltables.env';

  $http.get(url)
    .success(function(json){
      jsonData = json.query.results.quote;
      deferred.resolve(jsonData);
    })
    .error(function(err){
      console.log('Details error ', err);
      deferred.reject();
    })

    return deferred.promise;
};

/*Pricing related details*/
var getPriceData = function(ticker){

  var deferred = $q.defer();
  var url = "http://finance.yahoo.com/webservice/v1/symbols/" + ticker + "/quote?bypass=true&format=json&view=detail";

  $http.get(url)
    .success(function(json){
      jsonData = json.list.resources[0].resource.fields;
      deferred.resolve(jsonData);
    })
    .error(function(err){
      console.log('Price error ', err);
      deferred.reject();
    })

    return deferred.promise;
};


  return {
    getPriceData: getPriceData,
    getDetailsData: getDetailsData
  };
})

.factory("chartDataService", function($q, $http, encodeURIService){

  var getHistoricalData = function(ticker, fromDate, todayDate){

    var deferred = $q.defer();

     var query = 'select * from yahoo.finance.historicaldata where symbol = "' + ticker + '" and startDate = "' + fromDate + '" and endDate = "' + todayDate + '"';
     var url = 'http://query.yahooapis.com/v1/public/yql?q=' + encodeURIService.encode(query) + '&format=json&env=http://datatables.org/alltables.env';

     $http.get(url)
       .success(function(json){
         var jsonData = json.query.results.quote;

           var priceData = [],
           volumeData = [];

           jsonData.forEach(function(dayDataObject) {

             var dateToMillis = dayDataObject.Date,
             date = Date.parse(dateToMillis),
             price = parseFloat(Math.round(dayDataObject.Close * 100) / 100).toFixed(3),
             volume = dayDataObject.Volume,

             volumeDatum = '[' + date + ',' + volume + ']',
             priceDatum = '[' + date + ',' + price + ']';

             volumeData.unshift(volumeDatum);
             priceData.unshift(priceDatum);
           });

           var formattedChartData =
             '[{' +
               '"key":' + '"volume",' +
               '"bar":' + 'true,' +
               '"values":' + '[' + volumeData + ']' +
             '},' +
             '{' +
               '"key":' + '"' + ticker + '",' +
               '"values":' + '[' + priceData + ']' +
             '}]';

           deferred.resolve(formattedChartData);
          //  chartDataCacheService.put(cacheKey, formattedChartData);
       })
       .error(function(error){
         console.log('Chart Data Error: ', error);
         deferred.reject();
       });

       return deferred.promise;
  };

  return {
    getHistoricalData:getHistoricalData
  }
})
