# angularJS performance statistics, chrome extension for developers

## Initial phase of developement

### Goal 1: start work
Phase: 
  1. setup github project
  2. learn chrome extension development
  
### Goal 2: Architect/Setup Chrome Extension (create a basic extension which logs each required actions)
Phase:
  1. initial setup - manifest file
  2. background file to run on event listeners
  3. content script to connect to background
  4. devtool inspect connect to background
  5. 'designing, and developing communication'

Clear Picture:    
  install extension >> see logs on background page
  
Scenario:   
    open a new tab >>> 
    load any link >>> 
    open another tab with different link/same link >>> 
    switch tabs couple times >>> 
    inspect DOM for each >>> 
    switch tabs >>>
    close tabs.

### Goal 3: Detect angular on content script
Phase:
  1. init content script with onload event
  2. `detect angular page `
  
### Goal 4: Create devTool panel on conditions
  
