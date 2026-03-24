import  ArtObject  from "./objects/ArtObject.js";

/**
 * @typedef  {{obj: ArtObject, blocked: {
 * top: boolean,
 * right: boolean,
 * bottom: boolean,
 * left: boolean}}} CollisionResult
 */

/**
 * Collision detection by using Axis-Aligned Bounding Box (AABB) algorithm. 
 * Doesn't account for more deeply overlapping objects... expects user to separate objects on collision, so the 'blocked' properties may be
 * weird if that's not the case.
 * 
 * @param {ArtObject} obj1 
 * @param {ArtObject} obj2
 * @returns {CollisionResult|null} Returns an object with the colliding object and the blocked sides (top, right, bottom, left) or null if no collision.
 */
function getCollision(obj1, obj2) {
    
    const box1 = { x: obj1.pos.x, y: obj1.pos.y, width: obj1.width, height: obj1.height };
    const box2 = { x: obj2.pos.x, y: obj2.pos.y, width: obj2.width, height: obj2.height };

    const box1XEnd = box1.x + box1.width;
    const box2XEnd = box2.x + box2.width;
    const box1YEnd = box1.y + box1.height;
    const box2YEnd = box2.y + box2.height;

    // If box1 is to the left, top, right or bottom of box2 but not touching, i.e. outside of the limit of box2, they are not colliding. 
    const isColliding = !(box1XEnd <= box2.x || box1YEnd <= box2.y || box1.x >= box2XEnd || box1.y >= box2YEnd);


    if (isColliding) {
        // Seen from box 1's sides, so if box 2 sits on top of box 1 this is box1 beeing blocked to the top
        const overlapRight = box1XEnd - box2.x;
        const overlapLeft = box2XEnd - box1.x;
        const overlapTop = box2YEnd - box1.y;
        const overlapBottom =  box1YEnd - box2.y;

        // Find the minimum overlap
        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

        let blocked = { top: false, right: false, bottom: false, left: false };

        if (minOverlap === overlapRight) blocked.right = true;
        else if (minOverlap === overlapLeft) blocked.left = true;
        else if (minOverlap === overlapBottom) blocked.bottom = true;
        else if (minOverlap === overlapTop) blocked.top = true;

        return {
            obj: obj2,
            blocked,
            overlap: {
                x: Math.min(overlapLeft, overlapRight),
                y: Math.min(overlapTop, overlapBottom)
            }
        };
    }

    return null;
}


/**
 * @typedef Polygon
 * @property {Vertex[]} vertices
 */

/**
 * @typedef Vertex
 * @property {number} x 
 * @property {number} y
 */


/**
 * Computes the dot product between two vectors. 
 * @param {{x: number, y: number}} v1 
 * @param {{x: number, y: number}} v2 
 * @returns 
 */
function dot(v1, v2) {
    return v1.x * v2.x + v1.y * v2.y;
}


/**
 * Checks if p1 is colliding with p2 using the Separating Axis Theorem (SAT) algorithm.
 * Using the difference vector method, see https://www.youtube.com/watch?v=-EsWKT7Doww&t=1594s 
 * 
 * @param {Polygon} p1
 * @param {Polygon} p2
 */
function isCollidingSAT(p1, p2) {


    function getMinSeparation(p1, p2) {
        let separation = -1000000000;

        for (let i = 0; i < p1.vertices.length; ++i) {

            let minSeparation = 1000000000;
    
            const v1 = p1.vertices[i];
            const v2 = p1.vertices[(i + 1) % p1.vertices.length]; 
    
            const edge = { x: v2.x - v1.x, y: v2.y - v1.y };
        
            const normal = { x: edge.y, y: -edge.x }; 

            const magnitude = Math.sqrt(normal.x * normal.x + normal.y * normal.y);

            const normalizedNormal = { x: normal.x / magnitude, y: normal.y / magnitude };
    
            for (let j = 0; j < p2.vertices.length; ++j) {
    
                const v2b = p2.vertices[j];
    
                const diffVec = { x: v2b.x - v1.x, y: v2b.y - v1.y };
    
                minSeparation = Math.min(minSeparation, dot(diffVec, normalizedNormal))
            }
    
            if(minSeparation > separation) {
                separation = minSeparation;
            }
        }

        return separation;
    }
    
    return getMinSeparation(p1, p2) <= 0 && getMinSeparation(p2, p1) <= 0;
}



/**
 * @param {number} x 
 * @param {number} y 
 * @param {number} width 
 * @param {number} height
 * @returns {Polygon} polygon
 */
function toPolygon(x, y, width, height) {
    return {vertices: [{x, y}, {x: x + width, y}, {x: x + width, y: y + height}, 
        {x, y: y + height}
    ]};
}

export { isCollidingSAT,toPolygon, getCollision }; 