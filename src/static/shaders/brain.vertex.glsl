void main() {
    vec4 mvModel = vec4(position, 1.0);
    mvModel = instanceMatrix * mvModel;

    gl_Position = projectionMatrix * modelViewMatrix * mvModel;
}