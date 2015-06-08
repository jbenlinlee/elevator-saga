{
	init: function(elevators, floors) {				
		function setupElevator(el) {
			el.on("stopped_at_floor", function(floorNum) {
				floors[floorNum].requested = false;
			});
			
			el.on("idle", function() {
			});
		}
		
		function setupFloor(fl) {
			fl.checkPlan = function() {
				for (var i = 0; i < elevators.length; ++i) {
					var el = elevators[i];
					if (el.destinationQueue.length > 0) {
						var destFloor = el.destinationQueue[0];
						var newDest = destFloor;
						if (destFloor > el.currentFloor() && fl.floorNum() > el.currentFloor() && fl.floorNum() < destFloor) {
							newDest = fl.floorNum();
						} else if (destFloor < el.currentFloor() && fl.floorNum() < el.currentFloor() && fl.floorNum() > destFloor) {
							newDest = fl.floorNum();
						}
						
						el.destinationQueue = [newDest];
						el.checkDestinationQueue();
					}
				}
			}
			
			fl.on("up_button_pressed", function() {
				fl.requested = true;
				fl.checkPlan();
			});
			
			fl.on("down_button_pressed", function() {
				fl.requested = true;
				fl.checkPlan();
			});
		}
		
		for (var el = 0; el < elevators.length; ++el) {
			setupElevator(elevators[el]);
		}
	
		for (var fl = 0; fl < floors.length; ++fl) {
			setupFloor(floors[fl]);
			fl.requested = false;
		}
	},
	
	update: function(dt, elevators, floors) {
		var floorsRequested = new Array(floors.length);
		for (var flNum = 0; flNum < floors.length; ++flNum) {
			floorsRequested[flNum] = floors[flNum].requested;
		}
		
		for (var i = 0; i < elevators.length; ++i) {
			var el = elevators[i];
			
			if (el.destinationQueue.length == 0) {
				var pressedFloors = el.getPressedFloors();
				if (pressedFloors.length > 0) {
					console.debug(pressedFloors);
					
					// Go to closest pressed floor
					var closestFloor = el.currentFloor();
					var closestDistance = floors.length;
					for (var j = 0; j < pressedFloors.length; ++j) {
						var fl = pressedFloors[j];
						if (fl != el.currentFloor()) {
							var dist = Math.abs(fl - el.currentFloor());
							console.debug(fl + " dist = " + dist);
							if (dist < closestDistance) {
								closestDistance = dist;
								closestFloor = fl;
							}
						}
					}
				
					console.debug("on fl " + el.currentFloor() + " closest pressed fl " + closestFloor);
					el.goToFloor(closestFloor);
				} else {
					console.debug("No pressed floors, looking for closest requested floor");
					// Go to closest requested floor
					var closestFloor = el.currentFloor();
					var closestDistance = floors.length;
					for (var fl = 0; fl < floorsRequested.length; ++fl) {
						var floor = floors[fl];
						if (fl != el.currentFloor() && floorsRequested[fl] === true) {
							var dist = Math.abs(fl - el.currentFloor());
							if (dist < closestDistance) {
								closestDistance = dist;
								closestFloor = fl;
							}
						}
					}
					
					console.debug(floorsRequested);
					console.debug("on fl " + el.currentFloor() + " closest requested fl " + closestFloor + " at dist " + closestDistance);
					el.goToFloor(closestFloor);
					floorsRequested[closestFloor] = false;
				}
			}
		}
	}
}