#pragma strict

var scaleStep:float = 1.02;
var startDeepObject:GameObject;
var keepLevels:int = 3;
var currentLevel:int = 0;
var centerObject:GameObject;
var splitDistance:float = 1;

public class Support
{
	public static function removeFromArray(arr:Array, val)
	{
		var index = -1;
		for (var i = 0; i < arr.length; ++i)
	    	if(arr[i] == val) index = i;
	    
	    if(index != -1){
	    	arr.splice(index,1);
	    }
	}
}

public class DeepObject
{
    public var gameObject:GameObject;
    public var children = new Array();
    public static var allObjects = new Array();
    public static var prevObjects = new Array();
    public var level:int;
    
    public function DeepObject(gO:GameObject, l:int)
    {
    	gameObject = gO;
    	level = l;
    	allObjects.push( this );
    }
    
    public function removeFromTree()
    {
    	prevObjects.push(this);
    	Support.removeFromArray(allObjects, this);
		//gameObject.Destroy(gameObject);
    }
    
    public function addChild(gO:DeepObject)
    {
    	children.push(gO);
    }
    
    public function destroyChildren()
    {
    	for (var i = 0; i < children.length; ++i)
    	{
    		var castChildObj:DeepObject = children[i] as DeepObject;
    		castChildObj.destroy();
    	}
    	children = new Array();
    }
    
    private function destroy()
    {
    	destroyChildren();
    	Support.removeFromArray(allObjects, this);
		gameObject.Destroy(gameObject);
    }
}

function Start()
{
    
    var child = Instantiate(startDeepObject, Vector3(0, 0, 0), Quaternion.identity);
	
	child.transform.parent = transform;
	
	DeepObject.allObjects.push( new DeepObject(child, currentLevel) );
	
}

function Update()
{
	if (Input.GetKey(KeyCode.UpArrow))
    {
    	zoomGame(scaleStep);
    }
    if (Input.GetKey(KeyCode.DownArrow))
    {
    	zoomGame(1/scaleStep);
    }
    
    // check deep object levels
    var destroyObjects = new Array();
    var prevCurrentLevel = currentLevel;
    for(var i = 0; i < DeepObject.allObjects.length; ++i)
    {
    	var castObject:DeepObject = DeepObject.allObjects[i] as DeepObject;
    	
    	// ZOOM IN
    	// split objects
    	if(castObject.gameObject.activeSelf == true){
	    	// add children
	    	if((castObject.gameObject.transform.lossyScale.x > 1) && 
	    		(Vector3.Distance(castObject.gameObject.transform.position, centerObject.transform.position) < splitDistance)){
	    		splitDeepObject(castObject);
	    	}
    	}
    	
    	// ZOOM IN
    	// destroy roots
    	if(castObject.level <= (currentLevel-keepLevels)){
    		Debug.Log('destroy level '+castObject.level+' - currentLevel '+currentLevel);
    		destroyObjects.push(castObject);
    	}
    	
    	// ZOOM OUT
    	// remove children
    	// OPPOSITE OF SPLITTING CHILDREN
    	if(castObject.gameObject.activeSelf == false){
	    	if(castObject.gameObject.transform.lossyScale.x < 1)
	    	{
	    		castObject.destroyChildren();
	    		castObject.gameObject.SetActive(true);
	    		
	    		// set current level
	    		// step up one level
				if(castObject.level < currentLevel){
					currentLevel = castObject.level;
					Debug.Log('OUT - currentLevel '+currentLevel);
				}
	    	}
    	}
    }
    
    // ZOOM IN
    // destroy roots
    for(var j = 0; j < destroyObjects.length; ++j)
    {
    	var castDestroyObj:DeepObject = destroyObjects[j] as DeepObject;
    	castDestroyObj.removeFromTree();
    }
    
    // ZOOM OUT
    // step up one level
    if(currentLevel < prevCurrentLevel)
    {
    	unSplitRootObjects();
    }
}

function zoomGame(scaleStep:float)
{
	this.transform.localScale *= scaleStep;
}

function unSplitRootObjects()
{
	Debug.Log('unsplit Level '+((currentLevel+1)-keepLevels)+' - current level '+currentLevel);
	
	// add saved prevObject to allObjects
	var unsplitLevel = ((currentLevel+1)-keepLevels);
	var foundLevel = false;
	for(var i=(DeepObject.prevObjects.length-1); i>=0; i--)
    {
    	var castObj:DeepObject = DeepObject.prevObjects[i] as DeepObject;
    	if(castObj.level == unsplitLevel)
    	{
    		foundLevel = true;
    		DeepObject.prevObjects.splice(i,1);
    		DeepObject.allObjects.push(castObj);
    	}	
    }
    
    // previous level was not found
    if(!foundLevel)
    {
        var rootLevel = unsplitLevel+1;
        
        // get root object
        var rootObj:DeepObject;
        for(var j = 0; j < DeepObject.allObjects.length; ++j)
    	{
    		var castRootObj:DeepObject = DeepObject.allObjects[j] as DeepObject;
    		if(castRootObj.level == rootLevel){
    			rootObj = castRootObj;
    		}
    	}
    	
    	// make parent object
    	var parentPrefab = Instantiate(startDeepObject, Vector3(0,0,0), Quaternion.identity);
    	var childTransform = parentPrefab.transform.GetChild(0).transform;
        parentPrefab.transform.localScale = (Vector3(1,1,1) / childTransform.localScale.x);
        parentPrefab.transform.parent = transform;
        
        // add to array and parent obj
        var parentObj = new DeepObject(parentPrefab, unsplitLevel);
        parentObj.gameObject.SetActive(false);
        parentObj.addChild(rootObj);
        Debug.Log('ADDED OBJECT IN LEVEL '+unsplitLevel);
    	
        // create other children too
        var numChildren = parentPrefab.transform.childCount;
	    for (var k=1; k<numChildren; ++k)
	    {
	    	childTransform = parentPrefab.transform.GetChild(k).transform;
	    	
	    	// TODO
	    	// get prefab from component variable
	    	// child.GetComponent.<LodObject>().setController(gameObject);
	    	var childPrefab = Instantiate(startDeepObject, Vector3(childTransform.position.x, childTransform.position.y, childTransform.position.z), Quaternion.identity);
	        
	        childPrefab.transform.localScale = childTransform.localScale * parentPrefab.transform.lossyScale.x;
	        childPrefab.transform.parent = transform;
	        
	        // add to array and parent obj
	        var childObj = new DeepObject(childPrefab, rootLevel);
	    	parentObj.addChild(childObj);
		}
    }
}

function splitDeepObject(obj:DeepObject)
{
	/**
	* CONVERT ALL CHILDREN INTO NEW PREFABS (DEEP GAME OBJECTS)
	*/
	var numChildren = obj.gameObject.transform.childCount;
    for (var i = 0; i < numChildren; ++i)
    {
    	var childTransform = obj.gameObject.transform.GetChild(i).transform;
    	
    	// TODO
    	// get prefab from component variable
    	// child.GetComponent.<LodObject>().setController(gameObject);
    	var childPrefab = Instantiate(startDeepObject, Vector3(childTransform.position.x, childTransform.position.y, childTransform.position.z), Quaternion.identity);
        
        childPrefab.transform.localScale = childTransform.localScale;
        childPrefab.transform.parent = transform;
        
        // add to array and parent obj
        var childObj = new DeepObject(childPrefab, obj.level+1);
    	obj.addChild( childObj );
	}
	
	// set current level
	if(obj.level >= currentLevel){
		currentLevel = obj.level + 1;
		Debug.Log('IN - currentLevel '+currentLevel);
	}
	
	// remove deepObject from index
	// Support.removeFromArray(DeepObject.allObjects, obj);
	// Destroy(obj.gameObject);

	// hide object
	obj.gameObject.SetActive(false);
}