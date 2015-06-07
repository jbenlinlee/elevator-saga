{
   /*
    Figure out a direction and go in that direction as long as reasonable, then switch dir.
    Reasonable means:
      # there is a floor in dir that has requested same dir of travel
      # someone has requested a floor in dir of travel
   */

	init: function(elevators, floors) {				
		function setupElevator(el) {
			el.on("stopped_at_floor", function(floorNum) {
				floors[floorNum].requested = false;
			});
			
			el.on("idle", function() {
			});
		}
		
		function setupFloor(fl) {
			fl.on("up_button_pressed", function() {
				fl.requested = true;
			});
			
			fl.on("down_button_pressed", function() {
				fl.requested = true;
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
					var requestedFloors = new Array();
					for (var fl = 0; fl < floors.length; ++fl) {
						var floor = floors[fl];
						if (fl != el.currentFloor() && floor.requested) {
							requestedFloors.push(fl);
							var dist = Math.abs(fl - el.currentFloor());
							if (dist < closestDistance) {
								closestDistance = dist;
								closestFloor = fl;
							}
						}
					}
					
					console.debug(requestedFloors);
					console.debug("on fl " + el.currentFloor() + " closest requested fl " + closestFloor + " at dist " + closestDistance);
					el.goToFloor(closestFloor);
				}
			}
		}
	}
}