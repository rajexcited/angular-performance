(function(angular,window) {

///////////////////////////////
current features:
  - counts dirty watch
  - works with 1.2.7 & 1.2.4
  - gives digest time
  - gives error for digest fail
  - gives dirty watch expression
  - no need to give id or ng-app to start test
  - records digest statistics with timeId
///////////////////////////////
Agenda
	- find $$listeners impact
	- need suggestion for failure if any
	- http or AJAX or route impact
	- should work with other versions
	- total watches for application
	- gives scope for dirty watch
	- memory leaking concept
	- memory management concept
///////////////////////////////


// watch counter test for app,
// should be < 2000
// should not see more watchers running every(or frequently) digest cycle ex. > 500

angular.module('watchCounterApp',[])
      .run(function setUpWatchCounterApp($rootScope, $browser) {
          
          // initialize 
          angular.ngPerfRecords = {
            digestCycles : []
          };
		  
          try {
			var $injector = $($('.ng-scope')[0]).data('$injector');
			$rootScope = $rootScope || $injector.get('$rootScope');
			$browser = $browser || $injector.get('$browser');
		  }catch(e) {
			throw('Unexpected Error. Cannot run performance Test.');
		  }
          var oddDigestCycle = false, preDigestLog=undefined;
          var digestStartTime, digestWantedStartTime, digestFinishTime, digestPollutedTime, digestPureTime,startAsyncTime;
          var LocaleTimeDifference = new Date().getTimezoneOffset() * 60 * 1000;  // minutes * ToSeconds * ToMilliseconds
          
          // to support old browsers - prototype
          if (!Date.now) {
            Date.now = function now() {
              return new Date().getTime();
            };
          }
          Date.nows = 'nows';
          ////////////////////////////

          var recordTime = function() {
            digestFinishTime = Date.now();
            
            preDigestLog.pollutedDigestTime = digestFinishTime - digestStartTime;
            preDigestLog.pureDigestTime = digestFinishTime - digestWantedStartTime;
            preDigestLog.timeId = new Date(digestStartTime-LocaleTimeDifference).toJSON();
            preDigestLog.polluttedDigestWithAsyncTime =  digestFinishTime - startAsyncTime;
            angular.ngPerfRecords.digestCycles.push(preDigestLog);
            preDigestLog=undefined;			
          };
          
          // reverse engineered digest watch code to count version 1.2.7
          var countWatch = function() {
                  var watch, value, last,
                      watchers, length,
                      dirty, ttl, lastDirtyWatch, 
                      next, current, target = $rootScope,
                      watchLog = [],
                      logIdx, logMsg,
                      dirtyCount, total, recordLog, newErrorLog,
                      errorLog =[],
					  dirtyWatch= [];
          
                  // default values
                  ttl = 10;
                  dirtyCount=0;
                  total=0;
                  lastDirtyWatch = null;
				  
                  do { // "while dirty" loop
                    dirty = false;
                    current = target;

                    traverseScopesLoop:
                    do { // "traverse the scopes" loop
                      if ((watchers = current.$$watchers)) {
                        // process our watches
                        length = watchers.length;
                        total += length;
                        while (length--) {
                          try {
                            watch = watchers[length];
                            // Most common watches are on primitives, in which case we can short
                            // circuit it with === operator, only when === fails do we use .equals
                            if (watch) { 
                              last =  watch.perflast||watch.last;
                              if (((value = watch.get(current)) !== last) &&
                                  !(watch.eq
                                      ? angular.equals(value, last)
                                      : (typeof value == 'number' && typeof last == 'number'
                                         && isNaN(value) && isNaN(last)))) {
                                dirty = true;
                                watch.perflast = watch.eq ? angular.copy(value) : value;
                                lastDirtyWatch = watch;
                                dirtyCount++;
                                
                                logMsg = (angular.isFunction(watch.exp))
                                      ? 'fn: ' + (watch.exp.name || watch.exp.toString())
                                      : watch.exp;
                                logMsg += '; newVal: ' + angular.toJson(value) + '; oldVal: ' + angular.toJson(last);
                                dirtyWatch.push(logMsg);
                                
                                // used for error log - helpful for closure investigation
                                if (ttl < 5) {
                                  logIdx = 4 - ttl;
                                  if (!watchLog[logIdx]) watchLog[logIdx] = [];
                                  watchLog[logIdx].push(logMsg);
                                }
                              } else if (watch === lastDirtyWatch) {
                                // If the most recently dirty watcher is now clean, short circuit since the remaining watchers
                                // have already been tested.
                                dirty = false;
                                delete watch.perflast;
                                break traverseScopesLoop;
                              }
                            }
                          } catch (e) {
                            
                            throw(e);
                          }
                        }
                      }
          
                      // Insanity Warning: scope depth-first traversal
                      // yes, this code is a bit crazy, but it works and we have tests to prove it!
                      // this piece should be kept in sync with the traversal in $broadcast
                      if (!(next = (current.$$childHead ||
                          (current !== target && current.$$nextSibling)))) {
                        while(current !== target && !(next = current.$$nextSibling)) {
                          current = current.$parent;
                        }
                      }
                    } while ((current = next));
          
                    // `break traverseScopesLoop;` takes us to here
          
                    if(dirty && !(ttl--)) {
                        newErrorLog = {
								message: '{0} $digest() iterations reached. Aborting!\n' + 'Watchers fired in the last 5 iterations: {1}',
								TTL: 10,
								logs : angular.toJson(watchLog)
							  };
						errorLog.push(newErrorLog);
						dirty = false;
                          //throw(angular.toJson(errorLog));
                    }
          
                  } while (dirty);
                  
                  // finish log entry and return it
                  recordLog = {
                    watchNumbers: {
                            forDirty : dirtyCount,
                            total : total
                        },
                    dirtyWatchExp : dirtyWatch,
                    ttlError: errorLog
                  };
                  
                  return recordLog;
                };
          
          
		  $browser.addPollFn(function() {
				if($rootScope.$$asyncQueue.length) {
					startAsyncTime=Date.now();
				}
		  } );
		  
          $rootScope.$watch(function triggerDigestCycle() {
            // trigger watchCount for each digest cycle
            // to avoid infinite loop of its own during digest cycle checking
            return (preDigestLog? oddDigestCycle : (oddDigestCycle=!oddDigestCycle));
          },  
          function initiateWatchCount() {
              //digestStartTime = startAsyncTime || Date.now();
			  if(startAsyncTime && digestStartTime >= startAsyncTime) {
				startAsyncTime=undefined;
			  }
              digestStartTime = Date.now();
			  startAsyncTime = startAsyncTime || digestStartTime;
			  $rootScope.$$postDigest(recordTime);
              preDigestLog={};
              preDigestLog = countWatch();
              digestWantedStartTime = Date.now();
          });
          
      });

 })(angular,window);