# further development in [AngularJS Birbal] (https://github.com/rajexcited/AngularJS-Birbal)
## angular-performance
angularJS performance statistics, chrome extension for developers

It is in initial phase of developement.

Goal is to provide angular developers more run-time information of the application.

Following features/ functionalities, I'm trying to provide with graph.

  - counts dirty watch for each digest cycle
  - should be compatible with all angular versions (find out limitations)
  - gives digest time
  - gives error for digest fail
  - gives dirty watch expression
  - gives scope for dirty watch
  - highlight the element if possible for critical
  - no need to give id or ng-app to start test (should work for bootstrap as well)
  - records digest statistics with timeId (helps in further analysis)
  - find $$listeners impact to application (is it covering in digest cycle?)
  - gives suggestions/ tips for failure if possible
  - http or AJAX or route impact on application
  - total watches for application for each cycle to track app
  - learn and implement memory leaking concept
  - learn and implement memory management concept
  - try to use ng-graph-dependancy extension feature here directly.
